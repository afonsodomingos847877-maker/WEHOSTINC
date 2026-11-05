# WeHostHere — Mail Proxy Gateway (Zero Custo)

Este módulo permite aos clientes da WeHostHere utilizarem hostnames próprios nos seus leitores de e-mail (Outlook, Thunderbird, telemóvel), como:
- `mail.msservices.co.mz` (Porta 993 - IMAP SSL/TLS)
- `smtp.msservices.co.mz` (Porta 465 - SMTP SSL/TLS)

Encaminhando de forma transparente para a infraestrutura da Migadu (`imap.migadu.com` e `smtp.migadu.com`).

---

## 💡 Opção 1: Descoberta Automática (Autodiscover & Apple Profile) — JÁ ATIVA ($0)
Sem precisar de instalar servidores TCP externos, a WeHostHere já possui os seguintes endpoints ativos no Vercel/Render:
1. **Microsoft Autodiscover (XML & JSON v2)**: `/api/autodiscover`
2. **Mozilla Thunderbird Autoconfig**: `/api/autoconfig`
3. **Apple iOS/macOS 1-Click Profile**: `/api/emails/mobileconfig?email=utilizador@dominio.com`

Basta criar os seguintes registos no DNS do cliente:
| Tipo | Nome | Valor |
|---|---|---|
| CNAME | `autodiscover` | `wehosthere.com` |
| CNAME | `autoconfig` | `wehosthere.com` |

O cliente abre o Outlook ou iOS, digita o seu e-mail e palavra-passe, e o Outlook conecta automaticamente sem pedir endereços ou portas manuais.

---

## 🚀 Opção 2: Proxy TCP Gratuito no Fly.io ($0)
O Fly.io oferece máquinas TCP gratuitas com IPv4/IPv6 partilhados.

1. Instalar a CLI do Fly.io (`curl -L https://fly.io/install.sh | sh` ou via Windows PowerShell: `iwr https://fly.io/install.ps1 -useb | iex`)
2. Entrar no diretório:
   ```bash
   cd mail-proxy
   fly launch --no-deploy
   fly deploy
   ```
3. No painel DNS do domínio (ex: Turbohost/cPanel), apontar:
   - `mail.dominio.com` -> CNAME `wehosthere-mail-proxy.fly.dev`
   - `smtp.dominio.com` -> CNAME `wehosthere-mail-proxy.fly.dev`

---

## 🛡️ Opção 3: Oracle Cloud Always Free VPS (4 CPUs, 24GB RAM, IPv4 Fixo — $0 para sempre)
1. Crie uma instância Ubuntu na Oracle Cloud (nível gratuito perpétuo).
2. Instale o HAProxy:
   ```bash
   sudo apt update && sudo apt install -y haproxy
   ```
3. Copie o ficheiro `haproxy.cfg` para `/etc/haproxy/haproxy.cfg`.
4. Reinicie o serviço:
   ```bash
   sudo systemctl restart haproxy
   ```
5. No DNS, aponte `mail.dominio.com` e `smtp.dominio.com` com registo **A** para o IP público da sua máquina Oracle Cloud.

