# An Open Source Medium clone built with Lexical.
Please refer to the [guide](https://medium-editor-lmr5y.ondigitalocean.app/) for more details.

## Installation

To install and use packages from this repository, you need to configure npm to work with GitHub Packages.

### 1. Generate a GitHub Personal Access Token (classic)

First, you need a GitHub Personal Access Token (PAT) with the appropriate permissions to read packages.

*   Navigate to your GitHub token settings: Go to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
*   Click on **"Generate new token"** (or **"Generate new token (classic)"** if you have existing tokens).
*   Give your token a descriptive name (e.g., `read-github-packages`).
*   Select the `read:packages` scope. This scope grants permission to download packages from GitHub Packages.
*   Click **"Generate token"**.
*   **Important:** Copy the generated token immediately. You won't be able to see it again. Store it securely.

### 2. Configure `.npmrc`

You need to tell npm where to find the packages associated with the `@wingedrasengan927` scope. You can do this by creating or editing an `.npmrc` file.

*   This file can be located in your project's root directory (to configure npm for this specific project) or in your user directory (`~/.npmrc` on Linux/macOS or `C:\Users\<YourUsername>\.npmrc` on Windows) to configure npm globally.
*   Add the following line to your `.npmrc` file:

    ```
    @wingedrasengan927:registry=https://npm.pkg.github.com
    ```

    This line tells npm that any packages under the `@wingedrasengan927` scope should be fetched from GitHub Packages.

### 3. Log into npm

While configuring the `.npmrc` file with the registry is often sufficient for public packages, or if your PAT is passed via environment variables during CI/CD, you might need to explicitly log in for local development, especially for private packages.

*   Run the following command in your terminal:

    ```bash
    npm login --scope=@wingedrasengan927 --registry=https://npm.pkg.github.com
    ```

*   When prompted:
    *   **Username:** Enter your GitHub username.
    *   **Password:** Paste the Personal Access Token (PAT) you generated in Step 1.
    *   **Email:** Enter the email address associated with your GitHub account.

After these steps, you should be able to install packages from this repository using `npm install`.

To install the `@wingedrasengan927/medium-editor` package, run the following command:

```bash
npm install @wingedrasengan927/medium-editor
```
