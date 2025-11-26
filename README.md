# AYDO Plugin - ByteConnect

ByteConnect Plugin for AYDO - runs the ByteConnect SDK binary on your AYDO hub, enabling point rewards for sharing your bandwidth securely.

## Overview

The ByteConnect SDK is provided as a static binary for Ubuntu Linux, enabling simple integration without external dependencies or automatic updates. The binary runs deterministically and does not modify itself at runtime.

## Features

- **Static Binary Model**: The SDK is distributed as a static binary with no in-place auto-updating, ensuring deterministic behavior
- **Secure Gateway Communication**: All communication between SDK and gateway servers uses secure, authenticated channels
- **Low-Cost UDP Keep-Alive**: Lightweight UDP-based keep-alive mechanism minimizes CPU usage
- **Point Rewards**: Earn points for sharing bandwidth through the AYDO network

## Installation

1. Install dependencies:
```bash
npm install
```

2. Place the ByteConnect binary in the system directory:
```bash
mkdir -p ~/.aydo/byteconnect
# Copy your byteconnect binary to ~/.aydo/byteconnect/byteconnect
chmod +x ~/.aydo/byteconnect/byteconnect
```

3. Build the plugin:
```bash
npm run build
```

## Configuration

The plugin uses the following environment variables:

- `DAEMONIZE=1` - Enable background execution
- `PUBLISHER_ID=AYDO` - Node identification (required)

## Development

Run in development mode:
```bash
npm run debug
```

## Build

Build for production:
```bash
npm run build
```

Create release archive:
```bash
./compile.sh <version>
```

## SDK Security Measures

### Static Binary Model
The SDK is distributed as a static binary with no in-place auto-updating. This ensures deterministic behavior and reduces the risk of unauthorized modification.

### Secure Gateway Communication
All communication between the SDK and gateway servers takes place over secure, authenticated channels to prevent interception, tampering, or replay attacks.

### Low-Cost UDP Keep-Alive
The SDK uses a lightweight UDP-based keep-alive mechanism that minimizes CPU usage while maintaining reliable session presence.

### Gateway Flood Control
Gateway servers enforce flood limits and manage peer concurrency to maintain stability and resist abusive or malformed traffic.

## License

GPL-3.0

