
# Contributing Guidelines

Thank you for your interest in contributing to this project! Please follow these guidelines to help us maintain a high-quality codebase.

## How to Contribute

1. **Fork the repository** and create your branch from `main`.
2. **Describe your changes** clearly in your pull request.
3. **Write clear, concise commit messages**.
4. **Add tests** for any new features or bug fixes.
5. **Run all tests** and ensure they pass before submitting your pull request.
6. **Follow the code style** used in the project.

## Syncing Your Fork with the Original Repository

If there are changes made in the main branch of the original repository, you can sync them with your forked repository by following these steps:

1. **Add the original repository as an upstream remote (if not already added):**
   ```sh
   git remote add upstream https://github.com/Team-Aquarius-00/major_project.git
   ```
2. **Fetch the latest changes from the original repository:**
   ```sh
   git fetch upstream
   ```
3. **Switch to your local main branch:**
   ```sh
   git checkout main
   ```
4. **Merge the changes from the upstream main branch:**
   ```sh
   git merge upstream/main
   ```
5. **Push the updated main branch to your forked repository:**
   ```sh
   git push origin main
   ```

## Reporting Issues

- Search existing issues before opening a new one.
- Provide a clear and descriptive title and description.
- Include steps to reproduce, expected behavior, and screenshots if applicable.

## Pull Request Process

- Ensure your branch is up to date with `main`.
- Submit your pull request and fill out the PR template.
- One of the maintainers will review your code and provide feedback.
- Make requested changes promptly.

## Code of Conduct

- Be respectful and considerate in all interactions.
- No harassment, discrimination, or inappropriate behavior will be tolerated.

Thank you for helping make this project better!
