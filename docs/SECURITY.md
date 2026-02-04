# Security & Data Protection

## Overview

EYWA takes security and data protection seriously. This document outlines our security practices, data handling policies, and compliance measures to ensure the safety and privacy of academic work.

## 🔒 Security Measures

### 1. Authentication & Authorization

#### JWT-Based Authentication
- Secure token-based authentication using industry-standard JWT (JSON Web Tokens)
- Tokens expire after 7 days by default (configurable via `JWT_EXPIRES_IN`)
- Refresh token mechanism for seamless user experience
- Password hashing using bcrypt with salt rounds

#### Role-Based Access Control (RBAC)
- **Owner**: Full control over workspace, can manage members and delete workspace
- **Editor**: Can create, edit, and delete pages and content
- **Viewer**: Read-only access to workspace content
- Fine-grained permissions for each resource type

#### Multi-Factor Authentication (Planned)
- TOTP-based 2FA for enhanced account security
- SMS/Email verification options
- Backup codes for account recovery

### 2. Data Encryption

#### At Rest
- **Database Encryption**: All sensitive data encrypted at rest in PostgreSQL
- **File Storage**: S3-compatible storage with server-side encryption (SSE)
- **Secrets Management**: Environment variables and secrets stored securely
- **Password Storage**: Bcrypt hashing with per-user salt

#### In Transit
- **HTTPS Only**: All communications use TLS 1.3
- **WebSocket Security**: WSS (WebSocket Secure) for real-time collaboration
- **API Security**: All API endpoints protected with authentication
- **CORS Protection**: Strict CORS policies configured

### 3. Input Validation & Sanitization

#### Backend Validation
- Class-validator decorators for all DTO (Data Transfer Objects)
- SQL injection prevention using Prisma ORM parameterized queries
- XSS prevention through input sanitization
- File upload validation (type, size, content checking)

#### Frontend Validation
- Client-side validation for immediate user feedback
- Zod schemas for runtime type validation
- Content Security Policy (CSP) headers

### 4. API Security

#### Rate Limiting
- **Global Rate Limit**: 100 requests per minute per IP
- **Authentication Endpoints**: 5 attempts per 15 minutes
- **API Key Endpoints**: 1000 requests per hour per key
- **AI Features**: Daily usage limits per user

#### CSRF Protection
- CSRF tokens for state-changing operations
- SameSite cookie attributes
- Origin validation for sensitive endpoints

#### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### 5. Secure File Handling

#### Upload Security
- File type validation (whitelist approach)
- Maximum file size limits (configurable)
- Virus scanning for uploaded files (planned)
- Content-type verification
- Random filename generation to prevent overwriting

#### PDF Security
- Sandboxed PDF rendering using PDF.js
- No executable content in PDFs
- Annotation validation to prevent injection attacks

### 6. Database Security

#### Connection Security
- Connection pooling with PgBouncer (production)
- Encrypted connections to database
- Separate credentials for different environments
- Regular credential rotation

#### Query Security
- Prisma ORM prevents SQL injection
- Parameterized queries only
- No raw SQL queries in application code
- Database user with minimal required privileges

#### Backup & Recovery
- Automated daily database backups
- Point-in-time recovery capability
- Encrypted backup storage
- Regular backup restoration testing

### 7. Session Management

#### Secure Sessions
- HttpOnly cookies prevent XSS attacks
- Secure flag ensures HTTPS-only transmission
- SameSite attribute prevents CSRF
- Session timeout after inactivity
- Logout invalidates tokens

### 8. Third-Party Dependencies

#### Dependency Management
- Regular dependency updates via Dependabot
- Security vulnerability scanning
- Use of only well-maintained, reputable packages
- Minimal dependency footprint

#### AI Service Security
- API keys stored as environment variables
- No user data sent to AI without explicit consent
- Rate limiting for AI features
- Content filtering for AI inputs/outputs

## 🛡️ Data Protection & Privacy

### GDPR Compliance

#### Data Minimization
- Collect only necessary information
- Clear purpose for each data point
- Regular data cleanup and archival

#### User Rights
- **Right to Access**: Users can export all their data
- **Right to Erasure**: Complete data deletion on request
- **Right to Portability**: Export data in standard formats
- **Right to Rectification**: Users can update their information

#### Consent Management
- Clear consent for data processing
- Granular privacy settings
- Opt-in for non-essential features
- Easy withdrawal of consent

### Data Retention

#### Active Data
- User content: Retained while account is active
- Deleted content: 30-day soft delete period
- Audit logs: 90 days retention

#### Deleted Data
- Hard deletion after 30-day grace period
- No recovery after hard deletion
- Anonymization of required historical data

### Data Sharing

#### No Third-Party Sharing
- User data never sold to third parties
- No advertising or tracking
- Academic focus ensures data privacy

#### Service Providers
- Minimal use of service providers (hosting, email)
- Data Processing Agreements (DPA) in place
- Regular security audits of providers

## 🔍 Monitoring & Incident Response

### Security Monitoring

#### Logging
- Comprehensive audit logs for all actions
- Failed login attempt monitoring
- Unusual activity detection
- Centralized log management

#### Anomaly Detection
- Rate limit violation monitoring
- Suspicious IP address tracking
- Unusual access pattern detection
- Automated alerts for security events

### Incident Response

#### Response Plan
1. **Detection**: Automated monitoring and alerts
2. **Assessment**: Severity and impact evaluation
3. **Containment**: Immediate threat mitigation
4. **Eradication**: Root cause elimination
5. **Recovery**: Service restoration
6. **Post-Incident**: Review and improvement

#### Notification
- Users notified within 72 hours of breach
- Transparent communication about incident
- Clear steps for user protection
- Regular security updates

## 🧪 Security Testing

### Regular Testing

#### Automated Testing
- Dependency vulnerability scanning
- Static code analysis (SAST)
- Dynamic application security testing (DAST)
- Container security scanning

#### Manual Testing
- Quarterly penetration testing
- Code review for security issues
- Infrastructure security audits
- Third-party security assessments

## 📋 Compliance

### Standards & Frameworks

#### Industry Standards
- **OWASP Top 10**: Protection against common vulnerabilities
- **CWE/SANS Top 25**: Coverage of dangerous software errors
- **NIST Cybersecurity Framework**: Security controls implementation

#### Academic Requirements
- FERPA compliance (US educational records)
- Student data protection standards
- University security requirements

## 🚨 Reporting Security Issues

### Responsible Disclosure

If you discover a security vulnerability, please report it responsibly:

1. **Email**: security@eywa.app
2. **GitHub**: Private security advisory
3. **Response**: Within 48 hours acknowledgment

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if available)

### What NOT to Do
- Do not publicly disclose before fix
- Do not exploit the vulnerability
- Do not access others' data

## 🔄 Security Updates

### Regular Updates
- Security patches applied within 48 hours
- Dependency updates weekly
- Feature updates with security review
- Annual security audit

### Communication
- Security advisories for critical issues
- Changelog includes security fixes
- Proactive user notification
- Regular security blog posts

## 📚 Best Practices for Users

### Account Security
1. Use strong, unique passwords
2. Enable two-factor authentication (when available)
3. Review active sessions regularly
4. Log out on shared devices
5. Be cautious with share links

### Data Protection
1. Classify sensitive content appropriately
2. Use workspace permissions wisely
3. Regular backups of critical work
4. Review member access regularly
5. Report suspicious activity

### Secure Collaboration
1. Only share with trusted collaborators
2. Use viewer role for untrusted users
3. Disable share links when not needed
4. Monitor workspace activity logs
5. Revoke access for inactive users

## 📖 Additional Resources

- [OWASP Security Guidelines](https://owasp.org)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [GDPR Official Documentation](https://gdpr.eu)
- [Security Headers Best Practices](https://securityheaders.com)

## 📅 Document Information

- **Last Updated**: February 2026
- **Version**: 1.0
- **Next Review**: August 2026
- **Contact**: security@eywa.app

---

*This document is regularly updated to reflect our evolving security practices and compliance requirements.*
