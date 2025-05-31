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

### 4. Install Peer Dependencies

Before installing the main package, you need to ensure that all its peer dependencies are present in your project. This package assumes you are working within a React environment, so `react` and `react-dom` should ideally already be part of your project setup.

The primary peer dependencies you need to install are:

*   `@lexical/react`: ">=0.30.0"
*   `@tabler/icons-react`: ">=3.31.0"
*   `better-react-mathjax`: ">=2.3.0"
*   `lexical`: ">=0.30.0"
*   `react-aria-components`: ">=1.8.0"

You can install them using npm. Adjust the versions if needed to match your project's requirements, ensuring they meet the minimum versions specified above.

**Using npm:**
```bash
npm install @lexical/react @tabler/icons-react better-react-mathjax lexical react-aria-components
```

Once the peer dependencies are installed, you can proceed to install the main package.

To install the `@wingedrasengan927/medium-editor` package, run the following command:

```bash
npm install @wingedrasengan927/medium-editor
```
