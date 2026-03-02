import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TerminalSquare, Maximize2, Minimize2 } from 'lucide-react';

interface SSHConsoleProps {
    ip: string;
    isExpanded?: boolean;
    onExpandToggle?: () => void;
}

export function SSHConsole({ ip, isExpanded, onExpandToggle }: SSHConsoleProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const term = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const ws = useRef<WebSocket | null>(null);

    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [username, setUsername] = useState('root');
    const [password, setPassword] = useState('');

    const connectToSSH = () => {
        if (!username || connecting) return;

        setConnecting(true);

        if (!term.current && terminalRef.current) {
            term.current = new Terminal({
                theme: { background: '#09090b', foreground: '#e2e8f0', cursor: '#e2e8f0' },
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 13,
                cursorBlink: true,
            });
            fitAddon.current = new FitAddon();
            term.current.loadAddon(fitAddon.current);
            term.current.open(terminalRef.current);
            fitAddon.current.fit();

            term.current.onData((data) => {
                if (ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: 'data', data: btoa(data) }));
                }
            });
        }

        term.current?.clear();
        term.current?.write(`Connecting to ${username}@${ip}...\r\n`);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws.current = new WebSocket(`${protocol}//${window.location.host}/api/ssh`);

        ws.current.onopen = () => {
            ws.current?.send(JSON.stringify({
                type: 'connect', host: ip, username, password
            }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'data') {
                // Decode Base64 safely without losing multibyte chars
                const binStr = atob(data.data);
                const arr = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
                term.current?.write(arr);
            } else if (data.type === 'status') {
                term.current?.write(data.message);
                if (data.message.includes('ESTABLISHED')) {
                    setConnected(true);
                    setConnecting(false);
                }
                if (data.message.includes('ERROR')) {
                    setConnecting(false);
                }
            }
        };

        const handleResize = () => {
            if (fitAddon.current && term.current && ws.current?.readyState === WebSocket.OPEN) {
                fitAddon.current.fit();
                ws.current.send(JSON.stringify({
                    type: 'resize',
                    cols: term.current.cols,
                    rows: term.current.rows
                }));
            }
        };

        // Slight delay to handle DOM layout shift before sizing terminal
        setTimeout(() => handleResize(), 100);
        window.addEventListener('resize', handleResize);

        ws.current.onclose = () => {
            term.current?.write('\n\r*** CONNECTION CLOSED ***\r\n');
            setConnected(false);
            setConnecting(false);
            window.removeEventListener('resize', handleResize);
        };
    };

    const handleDisconnect = () => {
        ws.current?.close();
    };

    useEffect(() => {
        return () => {
            if (ws.current) ws.current.close();
            if (term.current) term.current.dispose();
        };
    }, []);

    return (
        <div className={`flex flex-col w-full border border-border overflow-hidden ${isExpanded ? 'h-[80vh] rounded-xl' : 'h-[500px] rounded-md'}`}>
            {!connected && (
                <div className="p-6 flex flex-col items-center justify-center h-full bg-card/50">
                    <TerminalSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2 text-center">Establish SSH Connection</h3>
                    <p className="text-sm text-muted-foreground text-center mb-6 max-w-[280px]">
                        Execute system commands and browse logs directly on {ip}.
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-[280px]">
                        <Input
                            type="text"
                            placeholder="Username (e.g., root)"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            disabled={connecting}
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && connectToSSH()}
                            disabled={connecting}
                        />
                        <Button onClick={connectToSSH} className="w-full" disabled={connecting || !username}>
                            {connecting ? 'Connecting...' : 'Connect to Console'}
                        </Button>
                    </div>
                </div>
            )}

            {connected && (
                <div className="flex justify-between items-center bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-xs font-mono text-zinc-300">{username}@{ip}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {onExpandToggle && (
                            <Button variant="ghost" size="icon" onClick={onExpandToggle} className="h-6 w-6 text-zinc-400 hover:text-white mr-2">
                                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-6 text-xs text-zinc-400 hover:text-white hover:bg-red-500/20">
                            Disconnect
                        </Button>
                    </div>
                </div>
            )}

            {/* Must remain in DOM to preserve xterm initialization */}
            <div
                ref={terminalRef}
                className={`flex-1 w-full bg-[#09090b] ${!term.current ? 'hidden' : 'p-2'}`}
            />
        </div>
    );
}
