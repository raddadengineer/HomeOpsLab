import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';

export function setupSSHWebSocket(server: Server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        if (request.url?.startsWith('/api/ssh')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
    });

    wss.on('connection', (ws) => {
        const ssh = new Client();
        let isReady = false;

        ws.on('message', (message: string) => {
            try {
                const payload = JSON.parse(message.toString());

                if (payload.type === 'connect') {
                    ssh.connect({
                        host: payload.host,
                        port: payload.port || 22,
                        username: payload.username,
                        password: payload.password,
                        privateKey: payload.privateKey,
                        readyTimeout: 10000
                    });
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        });

        ssh.on('ready', () => {
            isReady = true;
            ws.send(JSON.stringify({ type: 'status', message: '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n' }));

            ssh.shell((err, stream) => {
                if (err) {
                    ws.send(JSON.stringify({ type: 'status', message: '\r\n*** SSH SHELL ERROR ***\r\n' }));
                    return ws.close();
                }

                // Pipe backend stream to frontend WS
                stream.on('data', (d: Buffer) => {
                    ws.send(JSON.stringify({ type: 'data', data: d.toString('base64') }));
                });

                // Pipe frontend WS to backend stream
                ws.on('message', (message: string) => {
                    if (!isReady) return;
                    try {
                        const parsed = JSON.parse(message.toString());
                        if (parsed.type === 'data') {
                            stream.write(Buffer.from(parsed.data, 'base64'));
                        } else if (parsed.type === 'resize') {
                            stream.setWindow(parsed.rows, parsed.cols, 0, 0);
                        }
                    } catch (e) {
                        // Drop unparseable bounds
                    }
                });

                stream.on('close', () => {
                    ssh.end();
                    ws.close();
                });
            });
        }).on('error', (err) => {
            ws.send(JSON.stringify({ type: 'status', message: `\r\n*** SSH ERROR: ${err.message} ***\r\n` }));
            ws.close();
        }).on('close', () => {
            isReady = false;
            ws.close();
        });

        ws.on('close', () => {
            ssh.end();
        });
    });
}
