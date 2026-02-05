# Google Antigravity OAuth Setup

To enable Google Antigravity OAuth in your Osmo version of OpenClaw:

1.  **Environment Variables**:
    Set the following in your `.env` or shell:
    ```bash
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret
    ```

2.  **Configuration**:
    In your `openclaw setup` or `config.json`, ensure the gateway auth is set to use the Google provider.

3.  **Authentication**:
    Run `openclaw auth add google-antigravity` (if supported by CLI) or use the Dashboard to sign in.

4.  **Gemini Image Generation**:
    Once authenticated, you can use the `gemini_generate_image` tool directly.

## Transparency & Monitoring
The Dashboard now includes an **Activity Monitor** on the right side of the Chat view. 
It shows real-time tool calls and system activity.

## Multimodal Support
You can now:
*   Paste images directly into the chat.
*   Use the **+** (Plus) button in the chat input to upload images.
*   Generate images using the `gemini_generate_image` tool.
