# Speckit Constitution

## Code Quality Standards

### Testing Standards (TDD)
- **Test-Driven Development**: Write tests before implementation
- **Unit Tests**: Cover all functions and components
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows
- **Coverage**: Maintain minimum 80% code coverage

### Code Quality
- **Clean Code**: Follow SOLID principles and clean architecture
- **Naming**: Use descriptive, self-documenting names
- **Comments**: Document complex logic and business rules
- **Refactoring**: Regular code reviews and refactoring sessions
- **Linting**: Enforce consistent code style with ESLint/Prettier

## User Experience Consistency

### Design System
- **Consistent UI**: Follow established design patterns
- **Component Library**: Reusable UI components
- **Responsive Design**: Mobile-first approach
- **Performance**: Optimize for speed and smooth interactions
- **Accessibility**: WCAG AA/AAA compliance

### User Interface
- **Liquid Glass UI**: Modern glassmorphism design language
- **Micro-interactions**: Haptic feedback and smooth animations
- **Navigation**: Intuitive bottom tab navigation
- **Loading States**: Clear feedback for user actions
- **Error Handling**: User-friendly error messages

## Accessibility Features

### WCAG Compliance
- **AA Level**: Minimum accessibility standards
- **AAA Level**: Enhanced accessibility for all users
- **Color Contrast**: Sufficient contrast ratios
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and descriptions

### Color Vision Support
- **Deuteranopia**: Red-green color blindness support
- **Protanopia**: Red color blindness support
- **Tritanopia**: Blue-yellow color blindness support
- **Protanomaly**: Mild red color vision deficiency
- **Deuteranomaly**: Mild green color vision deficiency
- **Achromatopsia**: Complete color blindness support

### Motion and Interaction
- **Reduce Motion**: Respect user motion preferences
- **Text-to-Speech**: Voice output for content
- **Speech-to-Text**: Voice input capabilities
- **Text Hierarchy**: Clear typography and content structure
- **Focus Management**: Proper focus indicators

## Development Standards

### Version Control
- **Git Flow**: Feature branches and pull requests
- **Commit Messages**: Clear, descriptive commit messages
- **Code Reviews**: Peer review for all changes
- **Documentation**: Keep README and docs updated

### Performance
- **Bundle Size**: Optimize for mobile performance
- **API Efficiency**: Minimize API calls and data transfer
- **Caching**: Implement appropriate caching strategies
- **Monitoring**: Track performance metrics

### Security
- **Input Validation**: Sanitize all user inputs
- **Authentication**: Secure user authentication
- **Data Protection**: Encrypt sensitive data
- **API Security**: Rate limiting and CORS policies

## Project-Specific Standards

### SRG (Sky Recommends Games)
- **AI Integration**: OpenAI embeddings for game recommendations
- **Database**: Supabase with pgvector for similarity search
- **Backend**: Go server with OpenAPI documentation
- **Frontend**: React Native/Expo with TypeScript
- **Testing**: Jest for unit and integration tests

### Port Configuration
- **Backend**: Port 8080 (Go server)
- **Frontend**: Port 8081 (Expo Metro)
- **Database**: Port 54322 (Supabase local)
- **Consistency**: Maintain these port assignments

## Quality Assurance

### Code Reviews
- **Peer Review**: All code must be reviewed
- **Automated Checks**: CI/CD pipeline validation
- **Testing**: All tests must pass before merge
- **Documentation**: Update docs with code changes

### Continuous Improvement
- **Regular Audits**: Monthly code quality reviews
- **Feedback Loop**: User feedback integration
- **Performance Monitoring**: Regular performance checks
- **Security Updates**: Keep dependencies updated

---

*This constitution serves as the foundation for maintaining high code quality, excellent user experience, and comprehensive accessibility in the SRG project.*
