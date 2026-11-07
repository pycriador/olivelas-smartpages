"""
Git Storage & Version Control Engine for Olivelas OpsPages (/repos/{project-slug}/).
Manages per-project Git repositories, release snapshots, file inspection, diffs, and GitHub synchronization.
"""
from __future__ import annotations

import logging
import mimetypes
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError
from app.core.security import decrypt_secret
from app.models.meta_models import Project
from app.schemas.deployment import (
    BuildFileContentResponse,
    BuildFileNode,
    GitCommitItem,
    GitDiffItem,
    GitDiffResponse,
    GitRepoStatusResponse,
)

logger = logging.getLogger("aiops.opspages.git_storage")

TEXT_EXTENSIONS = {
    ".html", ".htm", ".css", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".json", ".svg", ".md", ".txt", ".xml", ".yaml", ".yml", ".toml",
    ".env", ".gitignore", ".map", ".csv", ".sh",
}


class GitStorageService:
    @staticmethod
    def get_project_root(slug: str) -> Path:
        return settings.repos_root_path / slug

    @classmethod
    def get_git_repo_dir(cls, slug: str) -> Path:
        return cls.get_project_root(slug) / "git_repo"

    @classmethod
    def get_releases_dir(cls, slug: str) -> Path:
        return cls.get_project_root(slug) / "releases"

    @classmethod
    def get_release_dir(cls, slug: str, version: str) -> Path:
        clean_ver = os.path.basename(version.strip())
        return cls.get_releases_dir(slug) / clean_ver

    @classmethod
    def get_current_dir(cls, slug: str) -> Path:
        return cls.get_project_root(slug) / "current"

    @classmethod
    def get_sources_dir(cls, slug: str) -> Path:
        return cls.get_project_root(slug) / "source"

    @classmethod
    def get_source_dir(cls, slug: str, version: str) -> Path:
        clean_ver = os.path.basename(version.strip())
        return cls.get_sources_dir(slug) / clean_ver

    @classmethod
    def get_workspace_site_source_dir(cls, slug: str) -> Path:
        # Path to /Users/willian.jesus/Downloads/aiops-opspages/sites/{slug}
        workspace_root = settings.repos_root_path.parent
        return workspace_root / "sites" / slug

    @staticmethod
    def _run_git(cwd: Path, args: List[str], timeout: int = 30) -> Tuple[int, str, str]:
        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"
        proc = subprocess.run(
            ["git"] + args,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()

    @classmethod
    def ensure_initialized(cls, project: Project) -> Path:
        """Ensures /repos/{slug}/git_repo and /repos/{slug}/releases exist and are git-initialized."""
        proj_root = cls.get_project_root(project.slug)
        git_dir = cls.get_git_repo_dir(project.slug)
        releases_dir = cls.get_releases_dir(project.slug)
        current_dir = cls.get_current_dir(project.slug)

        proj_root.mkdir(parents=True, exist_ok=True)
        git_dir.mkdir(parents=True, exist_ok=True)
        releases_dir.mkdir(parents=True, exist_ok=True)
        current_dir.mkdir(parents=True, exist_ok=True)

        if not (git_dir / ".git").exists():
            branch = project.github_branch or "main"
            cls._run_git(git_dir, ["init", "-b", branch])
            cls._run_git(git_dir, ["config", "user.name", "Olivelas OpsPages Engine"])
            cls._run_git(git_dir, ["config", "user.email", "opspages@olivelas.com.br"])

        if project.github_repo_url:
            cls.configure_remote(project)

        return git_dir

    @classmethod
    def configure_remote(cls, project: Project) -> None:
        if not project.github_repo_url:
            return
        git_dir = cls.get_git_repo_dir(project.slug)
        if not (git_dir / ".git").exists():
            return

        remote_url = project.github_repo_url.strip()
        token = decrypt_secret(project.github_token_encrypted) if project.github_token_encrypted else None
        if token and remote_url.startswith("https://") and "@" not in remote_url:
            remote_url = remote_url.replace("https://", f"https://x-access-token:{token}@", 1)

        code, out, _ = cls._run_git(git_dir, ["remote"])
        if "origin" in out.splitlines():
            cls._run_git(git_dir, ["remote", "set-url", "origin", remote_url])
        else:
            cls._run_git(git_dir, ["remote", "add", "origin", remote_url])

    @classmethod
    def commit_release_snapshot(
        cls,
        project: Project,
        version: str,
        source_dir: Path,
        author_name: str,
        author_email: str,
        release_notes: str,
    ) -> Tuple[str, str, int, int]:
        """
        Copies extracted static build files into:
        1. /repos/{slug}/releases/{version}/
        2. /repos/{slug}/git_repo/ (working tree) and creates a Git commit + tag `{version}`.
        Returns: (commit_sha, git_tag, file_count, total_size_bytes)
        """
        git_dir = cls.ensure_initialized(project)
        release_dir = cls.get_release_dir(project.slug, version)

        if release_dir.exists():
            shutil.rmtree(release_dir)
        release_dir.mkdir(parents=True, exist_ok=True)

        file_count = 0
        total_bytes = 0

        # Copy files into release snapshot
        for root, dirs, files in os.walk(source_dir):
            # Ignore any nested .git or __MACOSX metadata
            dirs[:] = [d for d in dirs if d not in (".git", "__MACOSX")]
            rel_root = Path(root).relative_to(source_dir)
            target_root = release_dir / rel_root
            target_root.mkdir(parents=True, exist_ok=True)

            for f in files:
                if f == ".DS_Store":
                    continue
                src_file = Path(root) / f
                dst_file = target_root / f
                shutil.copy2(src_file, dst_file)
                file_count += 1
                total_bytes += dst_file.stat().st_size

        # Sync working tree of git_repo (preserve .git)
        for item in git_dir.iterdir():
            if item.name == ".git":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()

        for item in release_dir.iterdir():
            dst = git_dir / item.name
            if item.is_dir():
                shutil.copytree(item, dst)
            else:
                shutil.copy2(item, dst)

        # Write a .opspages-manifest.json in the git repo so every version has a unique commit
        manifest_path = git_dir / ".opspages-release.json"
        import json
        from datetime import datetime, timezone

        manifest_data = {
            "project": project.slug,
            "version": version,
            "github_subpath": project.github_subpath,
            "author_email": author_email,
            "release_notes": release_notes,
            "file_count": file_count,
            "size_bytes": total_bytes,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        manifest_path.write_text(json.dumps(manifest_data, indent=2, ensure_ascii=False), encoding="utf-8")

        cls._run_git(git_dir, ["config", "user.name", author_name or "OpsPages Deployer"])
        cls._run_git(git_dir, ["config", "user.email", author_email or "opspages@olivelas.com.br"])
        cls._run_git(git_dir, ["add", "-A"])

        commit_msg = f"Release {version}: {release_notes or 'Static build deployment'}"
        cls._run_git(git_dir, ["commit", "--allow-empty", "-m", commit_msg])

        _, sha, _ = cls._run_git(git_dir, ["rev-parse", "HEAD"])
        cls._run_git(git_dir, ["tag", "-f", version, sha])

        if project.auto_sync_github and project.github_repo_url:
            try:
                cls.sync_github(project, direction="push")
            except Exception as e:
                logger.warning(f"Auto-sync to GitHub warning for {project.slug}: {e}")

        return sha, version, file_count, total_bytes

    @classmethod
    def activate_release(cls, project: Project, version: str) -> Path:
        """Updates /repos/{slug}/current/ to mirror /repos/{slug}/releases/{version}/."""
        release_dir = cls.get_release_dir(project.slug, version)
        if not release_dir.exists():
            raise NotFoundError(f"Release directory for version '{version}' not found in /repos/{project.slug}.")

        current_dir = cls.get_current_dir(project.slug)
        if current_dir.exists() or current_dir.is_symlink():
            if current_dir.is_symlink():
                current_dir.unlink()
            else:
                shutil.rmtree(current_dir)

        shutil.copytree(release_dir, current_dir)
        return current_dir

    @classmethod
    def delete_release_files(cls, slug: str, version: str) -> None:
        release_dir = cls.get_release_dir(slug, version)
        if release_dir.exists():
            shutil.rmtree(release_dir, ignore_errors=True)
        git_dir = cls.get_git_repo_dir(slug)
        if (git_dir / ".git").exists():
            cls._run_git(git_dir, ["tag", "-d", version])

    @classmethod
    def delete_project_repo(cls, slug: str) -> None:
        proj_root = cls.get_project_root(slug)
        if proj_root.exists():
            shutil.rmtree(proj_root, ignore_errors=True)

    @classmethod
    def get_repo_status(cls, project: Project, limit: int = 30) -> GitRepoStatusResponse:
        git_dir = cls.ensure_initialized(project)
        _, branch, _ = cls._run_git(git_dir, ["rev-parse", "--abbrev-ref", "HEAD"])
        code, head_sha, _ = cls._run_git(git_dir, ["rev-parse", "HEAD"])
        if code != 0:
            head_sha = None

        _, tags_out, _ = cls._run_git(git_dir, ["tag", "--sort=-creatordate"])
        tags = [t.strip() for t in tags_out.splitlines() if t.strip()]

        _, count_out, _ = cls._run_git(git_dir, ["rev-list", "--count", "HEAD"])
        total_commits = int(count_out) if count_out.isdigit() else 0

        # Build map of commit sha -> tags
        sha_tags: Dict[str, List[str]] = {}
        for t in tags:
            c, t_sha, _ = cls._run_git(git_dir, ["rev-list", "-n", "1", t])
            if c == 0 and t_sha:
                sha_tags.setdefault(t_sha.strip(), []).append(t)

        commits: List[GitCommitItem] = []
        if total_commits > 0:
            fmt = "%H|%h|%an|%ae|%cI|%s"
            c, log_out, _ = cls._run_git(git_dir, ["log", f"-n{limit}", f"--pretty=format:{fmt}"])
            if c == 0 and log_out:
                for line in log_out.splitlines():
                    parts = line.split("|", 5)
                    if len(parts) == 6:
                        full_sha, short_sha, an, ae, dt, msg = parts
                        commits.append(
                            GitCommitItem(
                                sha=full_sha,
                                short_sha=short_sha,
                                author_name=an,
                                author_email=ae,
                                date=dt,
                                message=msg,
                                tags=sha_tags.get(full_sha, []),
                            )
                        )

        return GitRepoStatusResponse(
            project_slug=project.slug,
            repo_path=f"/repos/{project.slug}",
            github_subpath=project.github_subpath or "/repos",
            initialized=True,
            current_branch=branch if branch and branch != "HEAD" else (project.github_branch or "main"),
            head_sha=head_sha,
            tags=tags,
            total_commits=total_commits,
            github_repo_url=project.github_repo_url,
            auto_sync_github=project.auto_sync_github,
            commits=commits,
        )

    @classmethod
    def get_diff_between_versions(
        cls,
        project: Project,
        base_version: str,
        target_version: str,
    ) -> GitDiffResponse:
        git_dir = cls.ensure_initialized(project)
        code, name_status_out, err = cls._run_git(
            git_dir,
            ["diff", "--name-status", base_version, target_version, "--", ".", ":(exclude).opspages-release.json"],
        )
        if code != 0:
            raise ValidationError(f"Could not compute Git diff between '{base_version}' and '{target_version}': {err}")

        files_changed: List[GitDiffItem] = []
        for line in name_status_out.splitlines():
            if not line.strip():
                continue
            parts = line.split("\t")
            status_code = parts[0][0]
            file_path = parts[-1]
            files_changed.append(GitDiffItem(status=status_code, path=file_path))

        _, diff_text, _ = cls._run_git(
            git_dir,
            ["diff", "--stat", "-p", base_version, target_version, "--", ".", ":(exclude).opspages-release.json"],
        )
        if len(diff_text) > 35000:
            diff_text = diff_text[:35000] + "\n... [Diff truncated]"

        return GitDiffResponse(
            base_version=base_version,
            target_version=target_version,
            files_changed=files_changed,
            diff_text=diff_text,
        )

    @classmethod
    def sync_github(cls, project: Project, direction: str = "push") -> Dict[str, Any]:
        git_dir = cls.ensure_initialized(project)
        if not project.github_repo_url:
            raise ValidationError("No GitHub repository URL is configured for this project.")

        cls.configure_remote(project)
        branch = project.github_branch or "main"

        if direction == "status":
            code, out, err = cls._run_git(git_dir, ["remote", "-v"])
            return {
                "success": code == 0,
                "direction": "status",
                "branch": branch,
                "github_repo_url": project.github_repo_url,
                "output": out or err,
            }

        if direction == "push":
            code, out, err = cls._run_git(git_dir, ["push", "-u", "origin", branch, "--tags"], timeout=45)
        else:
            code, out, err = cls._run_git(git_dir, ["pull", "origin", branch, "--tags"], timeout=45)

        return {
            "success": code == 0,
            "direction": direction,
            "branch": branch,
            "github_repo_url": project.github_repo_url,
            "output": out or err or "Operation completed",
        }

    @classmethod
    def list_version_files(cls, project: Project, version: str) -> List[BuildFileNode]:
        release_dir = cls.get_release_dir(project.slug, version)
        if not release_dir.exists():
            raise NotFoundError(f"Files for version '{version}' not found.")

        def build_tree(current_path: Path) -> List[BuildFileNode]:
            nodes: List[BuildFileNode] = []
            try:
                entries = sorted(current_path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
            except Exception:
                return nodes

            for entry in entries:
                if entry.name in (".git", ".DS_Store", "__MACOSX"):
                    continue
                rel = entry.relative_to(release_dir).as_posix()
                if entry.is_dir():
                    children = build_tree(entry)
                    dir_size = sum(c.size_bytes for c in children)
                    nodes.append(
                        BuildFileNode(
                            name=entry.name,
                            path=rel,
                            type="directory",
                            size_bytes=dir_size,
                            children=children,
                        )
                    )
                else:
                    sz = entry.stat().st_size
                    ext = entry.suffix.lower() if entry.suffix else None
                    nodes.append(
                        BuildFileNode(
                            name=entry.name,
                            path=rel,
                            type="file",
                            size_bytes=sz,
                            extension=ext,
                        )
                    )
            return nodes

        return build_tree(release_dir)

    @classmethod
    def read_version_file(cls, project: Project, version: str, rel_path: str) -> BuildFileContentResponse:
        release_dir = cls.get_release_dir(project.slug, version).resolve()
        if not release_dir.exists():
            raise NotFoundError(f"Release '{version}' not found.")

        clean_rel = rel_path.lstrip("/")
        target_file = (release_dir / clean_rel).resolve()

        # Prevent path traversal
        if not str(target_file).startswith(str(release_dir)):
            raise ValidationError("Invalid file path traversal attempt.")
        if not target_file.exists() or not target_file.is_file():
            raise NotFoundError(f"File '{clean_rel}' not found in release '{version}'.")

        size_bytes = target_file.stat().st_size
        mime_type, _ = mimetypes.guess_type(str(target_file))
        mime_type = mime_type or "application/octet-stream"

        ext = target_file.suffix.lower()
        is_text = ext in TEXT_EXTENSIONS or mime_type.startswith("text/") or mime_type in (
            "application/javascript",
            "application/json",
            "application/xml",
            "image/svg+xml",
        )

        content = None
        is_binary = not is_text
        if is_text and size_bytes <= 1024 * 512:  # Up to 512KB text preview
            try:
                content = target_file.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                is_binary = True
                content = None

        return BuildFileContentResponse(
            version=version,
            path=clean_rel,
            size_bytes=size_bytes,
            is_binary=is_binary,
            mime_type=mime_type,
            content=content,
        )

    @classmethod
    def save_source_snapshot(cls, slug: str, version: str, source_code_dir: Path) -> None:
        """Copies the TypeScript/project source code (excluding dist/ and node_modules/) into /repos/{slug}/source/{version}/."""
        if not source_code_dir.exists():
            return
        dst_dir = cls.get_source_dir(slug, version)
        if dst_dir.exists():
            shutil.rmtree(dst_dir)
        dst_dir.mkdir(parents=True, exist_ok=True)

        ignored_dirs = {".git", "__MACOSX", "node_modules", "dist"}
        for root, dirs, files in os.walk(source_code_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            rel_root = Path(root).relative_to(source_code_dir)
            target_root = dst_dir / rel_root
            target_root.mkdir(parents=True, exist_ok=True)
            for f in files:
                if f == ".DS_Store":
                    continue
                shutil.copy2(Path(root) / f, target_root / f)

    @classmethod
    def build_release_zip_bytes(cls, project: Project, version: Optional[str] = None) -> Tuple[bytes, str]:
        """
        Packages the static HTML/CSS/JS/IMG build for `version` (or active_version) into a .zip archive
        ready to be extracted and served on any local HTTP server.
        """
        import io
        import zipfile

        resolved_ver = (version or project.active_version or "1.0.0").strip()
        release_dir = cls.get_release_dir(project.slug, resolved_ver)
        if not release_dir.exists():
            # Try current/ fallback
            current_dir = cls.get_current_dir(project.slug)
            if current_dir.exists():
                release_dir = current_dir
            else:
                raise NotFoundError(f"Static build for version '{resolved_ver}' not found in /repos/{project.slug}.")

        buf = io.BytesIO()
        ignored_names = {".git", ".DS_Store", "__MACOSX", ".opspages-release.json"}
        with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(release_dir):
                dirs[:] = [d for d in dirs if d not in ignored_names]
                for f in files:
                    if f in ignored_names:
                        continue
                    full_path = Path(root) / f
                    arcname = full_path.relative_to(release_dir).as_posix()
                    zf.write(full_path, arcname=arcname)

        clean_v = resolved_ver.lstrip("v")
        zip_filename = f"{project.slug}-build-{clean_v}-static-html.zip"
        return buf.getvalue(), zip_filename

    @classmethod
    def build_source_zip_bytes(cls, project: Project, version: Optional[str] = None) -> Tuple[bytes, str]:
        """
        Packages the TypeScript source code for `version` (from /repos/{slug}/source/{version} or sites/{slug})
        into a .zip archive containing package.json, tsconfig.json, src/*.ts, public/*, scripts/build.mjs, etc.
        """
        import io
        import zipfile

        resolved_ver = (version or project.active_version or "1.0.0").strip()
        source_dir = cls.get_source_dir(project.slug, resolved_ver)
        if not source_dir.exists():
            # Try without/with 'v' prefix
            alt_ver = resolved_ver[1:] if resolved_ver.startswith("v") else f"v{resolved_ver}"
            alt_dir = cls.get_source_dir(project.slug, alt_ver)
            ws_dir = cls.get_workspace_site_source_dir(project.slug)
            if alt_dir.exists():
                source_dir = alt_dir
            elif ws_dir.exists():
                source_dir = ws_dir
            else:
                # Fallback to release dir if no separate source tree exists
                release_dir = cls.get_release_dir(project.slug, resolved_ver)
                if release_dir.exists():
                    source_dir = release_dir
                else:
                    raise NotFoundError(f"Source code for '{project.slug}' ({resolved_ver}) not found.")

        buf = io.BytesIO()
        ignored_dirs = {".git", "__MACOSX", "node_modules", "dist"}
        ignored_files = {".DS_Store", ".opspages-release.json"}
        with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(source_dir):
                dirs[:] = [d for d in dirs if d not in ignored_dirs]
                for f in files:
                    if f in ignored_files:
                        continue
                    full_path = Path(root) / f
                    arcname = full_path.relative_to(source_dir).as_posix()
                    zf.write(full_path, arcname=arcname)

        clean_v = resolved_ver.lstrip("v")
        zip_filename = f"{project.slug}-source-{clean_v}-typescript.zip"
        return buf.getvalue(), zip_filename
