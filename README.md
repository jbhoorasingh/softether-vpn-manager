# SoftEther VPN Manager

A modern web interface for managing SoftEther VPN servers, built with Vue.js and utilizing SoftEther's JSON-RPC API. This project aims to provide a comprehensive web-based management interface with full feature parity to the JSON-RPC API.

## Features

- Modern, responsive web interface for SoftEther VPN management
- Complete implementation of SoftEther VPN JSON-RPC API
- Real-time server monitoring and statistics
- Comprehensive user and connection management
- Hub and virtual network configuration
- Security policy management
- Bridge and cascade connection settings
- Layer 3 switch management
- Server and hub configuration backup/restore
- Detailed logging and auditing capabilities

## Screenshots

Here are some screenshots of the VPN Manager interface:

### Dashboard
![Dashboard](/docs/screenshots/ss-dashboard.png)

### Virtual Hubs
![Virtual Hubs](/docs/screenshots/ss-virtual-hubs.png)

### Server Capabilities
![Server Capabilities](/docs/screenshots/ss-server-capabilities.png)

### Settings
![Settings](/docs/screenshots/ss-settings.png)

### Logs
![Logs](/docs/screenshots/ss-logs.png)

## Prerequisites

- Node.js 16.x or higher
- SoftEther VPN Server with JSON-RPC enabled
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jbhorasingh/softether-vpn-manager.git
cd softether-vpn-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Configuration

1. Configure your SoftEther VPN server to enable JSON-RPC:
   - Ensure the JSON-RPC listener is enabled on your VPN server
   - Configure the appropriate port and access controls

2. Configure the web interface:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Update the environment variables with your server details:
     ```
     VITE_VPN_SERVER_HOST=your_vpn_server_ip
     VITE_VPN_SERVER_PORT=5555
     ```

## Development

This project uses:
- Vue.js 3 with Composition API
- Vite for build tooling
- TypeScript for type safety
- Tailwind CSS for styling
- Pinia for state management
- Vue Router for routing

To start development:
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Contributing

We welcome contributions to help make this project a potential official web interface for SoftEther VPN. When contributing:

1. Follow the Vue.js style guide and best practices
2. Ensure complete test coverage for new features
3. Document all new functionality
4. Maintain consistency with SoftEther's existing interfaces
5. Follow the standard GitHub flow:
   - Fork the repository
   - Create your feature branch (`git checkout -b feature/AmazingFeature`)
   - Commit your changes (`git commit -m 'Add some AmazingFeature'`)
   - Push to the branch (`git push origin feature/AmazingFeature`)
   - Open a Pull Request

## Integration Goals

This project aims to be considered for integration into the official SoftEther VPN project as an alternative web interface. To achieve this, we focus on:

- Complete feature parity with the JSON-RPC API
- High-quality, maintainable code
- Comprehensive documentation
- Robust security practices
- Excellent user experience
- Cross-browser compatibility

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

### Why GPL?

We chose the GPL license because:
1. It ensures that the software remains free and open source
2. It protects users' freedom to run, copy, distribute, study, change and improve the software
3. It requires that any modifications or derived works also remain open source
4. It aligns with the spirit of community-driven development

### Contributing

By contributing to this project, you agree to license your contributions under the GNU GPL v3.0.

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/jbhoorasingh/softether-vpn-manager/issues) page
2. Review the [SoftEther VPN JSON-RPC API documentation](https://github.com/SoftEtherVPN/SoftEtherVPN/tree/master/developer_tools/vpnserver-jsonrpc-clients/)
3. Open a new issue with detailed information about your problem

## Acknowledgments

- SoftEther VPN Project for their excellent VPN server software and JSON-RPC API
- All contributors who have helped with the development of this web interface 