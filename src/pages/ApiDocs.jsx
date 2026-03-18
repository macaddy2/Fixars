import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FixarsAPI, API_ENDPOINTS } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
    Code2,
    Play,
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Key,
    Zap,
    Book,
    Terminal
} from 'lucide-react'

const METHOD_COLORS = {
    GET: 'bg-success/10 text-success border-success/20',
    POST: 'bg-primary/10 text-primary border-primary/20',
    PUT: 'bg-warning/10 text-warning border-warning/20',
    DELETE: 'bg-destructive/10 text-destructive border-destructive/20'
}

function CodeBlock({ code, language = 'json' }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative rounded-lg bg-[#1e1e2e] border border-[#313244] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#313244]">
                <span className="text-xs text-[#6c7086] font-mono">{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 text-sm font-mono text-[#cdd6f4] overflow-x-auto leading-relaxed">
                <code>{code}</code>
            </pre>
        </div>
    )
}

function EndpointCard({ endpoint }) {
    const [expanded, setExpanded] = useState(false)
    const [response, setResponse] = useState(null)
    const [loading, setLoading] = useState(false)
    const [codeTab, setCodeTab] = useState('javascript')

    const tryIt = async () => {
        setLoading(true)
        try {
            const api = new FixarsAPI()
            let result
            switch (endpoint.path) {
                case '/stakes': result = await api.getStakes(); break
                case '/ideas': result = await api.getIdeas(); break
                case '/boards': result = await api.getBoards(); break
                case '/talents': result = await api.getTalents(); break
                case '/posts': result = await api.getPosts(); break
                default: result = { data: [], error: 'Endpoint not implemented in demo' }
            }
            setResponse(JSON.stringify(result.data, null, 2))
        } catch (err) {
            setResponse(JSON.stringify({ error: err.message }, null, 2))
        } finally {
            setLoading(false)
        }
    }

    const getCodeSample = () => {
        const base = 'https://your-project.supabase.co/rest/v1'
        switch (codeTab) {
            case 'javascript':
                return `const response = await fetch('${base}${endpoint.path}', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
const data = await response.json()`
            case 'python':
                return `import requests

response = requests.get(
    '${base}${endpoint.path}',
    headers={
        'apikey': 'YOUR_ANON_KEY',
        'Authorization': 'Bearer YOUR_ANON_KEY'
    }
)
data = response.json()`
            case 'curl':
                return `curl '${base}${endpoint.path}' \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_ANON_KEY"`
            default:
                return ''
        }
    }

    return (
        <Card className="overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/5 transition-colors"
            >
                <Badge className={cn("font-mono text-xs px-2 py-0.5 border", METHOD_COLORS[endpoint.method])}>
                    {endpoint.method}
                </Badge>
                <code className="text-sm font-mono text-foreground flex-1">{endpoint.path}</code>
                <span className="text-sm text-muted hidden sm:block">{endpoint.description}</span>
                {expanded ? <ChevronDown className="w-4 h-4 text-muted shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted shrink-0" />}
            </button>

            {expanded && (
                <div className="border-t p-4 space-y-4 animate-fade-in">
                    <p className="text-sm text-muted">{endpoint.description}</p>

                    {/* Parameters */}
                    {endpoint.params?.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Parameters</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/5">
                                            <th className="text-left px-3 py-2 text-muted font-medium">Name</th>
                                            <th className="text-left px-3 py-2 text-muted font-medium">Type</th>
                                            <th className="text-left px-3 py-2 text-muted font-medium hidden sm:table-cell">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {endpoint.params.map(param => (
                                            <tr key={param.name} className="border-t">
                                                <td className="px-3 py-2">
                                                    <code className="text-xs bg-muted/10 px-1.5 py-0.5 rounded">{param.name}</code>
                                                    {param.required && <span className="text-destructive text-xs ml-1">*</span>}
                                                </td>
                                                <td className="px-3 py-2 text-muted">{param.type}</td>
                                                <td className="px-3 py-2 text-muted hidden sm:table-cell">{param.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Code Samples */}
                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Code Sample</h4>
                        <Tabs value={codeTab} onValueChange={setCodeTab}>
                            <TabsList className="mb-2">
                                <TabsTrigger value="javascript" className="text-xs">JavaScript</TabsTrigger>
                                <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
                                <TabsTrigger value="curl" className="text-xs">cURL</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <CodeBlock code={getCodeSample()} language={codeTab} />
                    </div>

                    {/* Try It */}
                    {endpoint.method === 'GET' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-foreground">Try It</h4>
                                <Button size="sm" onClick={tryIt} disabled={loading}>
                                    <Play className="w-3 h-3 mr-1" />
                                    {loading ? 'Running...' : 'Send Request'}
                                </Button>
                            </div>
                            {response && (
                                <CodeBlock code={response} language="json" />
                            )}
                        </div>
                    )}

                    {/* Response Format */}
                    {endpoint.response && !response && (
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Response</h4>
                            <CodeBlock code={endpoint.response} language="json" />
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}

export default function ApiDocs() {
    return (
        <main className="py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                        <Code2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">API Reference</h1>
                        <p className="text-muted">Build on the Fixars platform</p>
                    </div>
                </div>

                {/* Quick Start */}
                <Card className="my-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="w-4 h-4 text-warning" />
                            Quick Start
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-muted/5 border">
                                <Key className="w-8 h-8 text-primary mb-2" />
                                <h3 className="font-semibold text-foreground text-sm mb-1">1. Get API Key</h3>
                                <p className="text-xs text-muted">Generate an API key from your Dashboard settings.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/5 border">
                                <Terminal className="w-8 h-8 text-accent mb-2" />
                                <h3 className="font-semibold text-foreground text-sm mb-1">2. Make Requests</h3>
                                <p className="text-xs text-muted">Use REST endpoints with your API key in headers.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/5 border">
                                <Book className="w-8 h-8 text-skillscanvas mb-2" />
                                <h3 className="font-semibold text-foreground text-sm mb-1">3. Explore</h3>
                                <p className="text-xs text-muted">Try endpoints below with the "Send Request" button.</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Authentication</h4>
                            <CodeBlock
                                code={`// Include these headers in every request
{
  "apikey": "YOUR_ANON_KEY",
  "Authorization": "Bearer YOUR_ANON_KEY"
}`}
                                language="json"
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-sm">
                            <p className="text-foreground">
                                <strong>Rate Limits:</strong> 100 requests/minute for anonymous keys, 1000/minute for authenticated.
                                Pagination via <code className="text-xs bg-muted/20 px-1 rounded">limit</code> and <code className="text-xs bg-muted/20 px-1 rounded">offset</code> query params.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Endpoints */}
                <div className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground mb-4">Endpoints</h2>
                    {API_ENDPOINTS.map((endpoint, i) => (
                        <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                            <EndpointCard endpoint={endpoint} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
