# Branch Management & Fast Deployment Playbook

## Context
- GitHub Repo: `https://github.com/sagardawadi16-web/shop.git` (`sagardawadi16-web/shop`)
- Live Domain: `https://dawosti.com`
- Cloudflare Worker/Pages: `dashain-offer` (watches `main` and repo default branch for live auto-deploys)
- Backup Tag/Branch: `stable-backup` (pristine freeze of the working mobile-responsive site)

## Instant Commands (Zero-Latency Switching)

### 1. Create and Switch to a New Branch
```powershell
git checkout -b <branch_name>
git push -u origin <branch_name>
```

### 2. Make Any Branch the Official Default on GitHub (via `gh` CLI)
```powershell
gh repo edit sagardawadi16-web/shop --default-branch <branch_name>
```

### 3. Deploy Current Branch to Live `dawosti.com` Instantly
Always dual-push so Cloudflare builds it regardless of which branch it is actively monitoring:
```powershell
git push origin <branch_name>:main && git push origin <branch_name>
```

### 4. Emergency Instant Rollback to Stable Version
If an experiment breaks production, restore `dawosti.com` in seconds:
```powershell
git push origin stable-backup:main --force
```
