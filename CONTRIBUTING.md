# Contributing Guide

## 1. Access Required
Before starting, ask repository owner to add you as collaborator:
- GitHub -> Repository -> Settings -> Collaborators and teams -> Add people
- Accept invite from your GitHub notifications/email

## 2. Clone and Setup
```bash
git clone https://github.com/niyaz-ahmad777/Financial-MIS-Project.git
cd Financial-MIS-Project
```

## 3. Work in Feature Branch
Never work directly on `main`.

```bash
git checkout -b feature/your-task-name
```

Examples:
- `feature/login-ui-fixes`
- `feature/fraud-score-api`
- `fix/alerts-filter-bug`

## 4. Commit Your Changes
```bash
git add .
git commit -m "Add: short clear message"
```

## 5. Push Branch
```bash
git push -u origin feature/your-task-name
```

## 6. Create Pull Request
- Open GitHub repository
- Click Compare & pull request
- Base branch: `main`
- Add summary of what changed
- Request review from team lead/owner

## 7. Sync With Latest Main
Before new work:

```bash
git checkout main
git pull origin main
git checkout feature/your-task-name
git merge main
```

## 8. Useful Rules
- Keep PRs small and focused
- One feature/fix per branch
- Resolve conflicts locally before requesting review
- Do not force-push to `main`

## 9. Owner Checklist (for onboarding teammates)
1. Add collaborator in GitHub settings
2. Confirm invite accepted
3. Ask teammate to clone repo
4. Ask teammate to work only on feature branches
5. Review and merge PRs into `main`
