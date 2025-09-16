# Contributing to E-Commerce Platform

Thank you for your interest in contributing to our e-commerce platform! This guide will help you get started with contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Git
- Basic knowledge of Next.js, TypeScript, and React
- Supabase account for database testing

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/ecommerce-platform.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see README.md)
5. Run the development server: `npm run dev`

## 📋 How to Contribute

### Types of Contributions
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage improvements

### Before You Start
1. Check existing issues and pull requests
2. Create an issue to discuss major changes
3. Follow our coding standards
4. Ensure your changes don't break existing functionality

## 🔧 Development Workflow

### 1. Create a Branch
\`\`\`bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
\`\`\`

### 2. Make Changes
- Write clean, readable code
- Follow TypeScript best practices
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes
\`\`\`bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Test the build
npm run build
\`\`\`

### 4. Commit Your Changes
We use conventional commits:
\`\`\`bash
git commit -m "feat: add user profile management"
git commit -m "fix: resolve checkout calculation bug"
git commit -m "docs: update API documentation"
\`\`\`

### 5. Push and Create PR
\`\`\`bash
git push origin your-branch-name
\`\`\`
Then create a pull request on GitHub.

## 📝 Coding Standards

### TypeScript Guidelines
\`\`\`typescript
// Use explicit types
interface User {
  id: string
  email: string
  role: 'admin' | 'customer'
}

// Use proper error handling
try {
  const result = await apiCall()
  return result
} catch (error) {
  console.error('[v0] API call failed:', error)
  throw new Error('Failed to fetch data')
}

// Use meaningful variable names
const isUserAuthenticated = checkAuthStatus()
const userOrderHistory = await fetchUserOrders(userId)
\`\`\`

### React Component Guidelines
\`\`\`tsx
// Use proper component structure
interface ComponentProps {
  title: string
  onAction: () => void
  isLoading?: boolean
}

export function Component({ title, onAction, isLoading = false }: ComponentProps) {
  return (
    <div className="component-container">
      <h2 className="text-xl font-semibold">{title}</h2>
      <button 
        onClick={onAction}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? 'Loading...' : 'Action'}
      </button>
    </div>
  )
}
\`\`\`

### CSS/Tailwind Guidelines
\`\`\`tsx
// Use semantic class names
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h3 className="text-lg font-medium text-gray-900">Title</h3>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
    Action
  </button>
</div>

// Prefer Tailwind utilities over custom CSS
// Use responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
\`\`\`

## 🧪 Testing Guidelines

### Unit Tests
\`\`\`typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
\`\`\`

### Integration Tests
\`\`\`typescript
// __tests__/api/products.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/products'

describe('/api/products', () => {
  it('returns products list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('products')
  })
})
\`\`\`

## 📚 Documentation Standards

### Code Comments
\`\`\`typescript
/**
 * Calculates the total price including tax and shipping
 * @param items - Array of cart items
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param shippingCost - Shipping cost in cents
 * @returns Total price in cents
 */
export function calculateTotal(
  items: CartItem[],
  taxRate: number,
  shippingCost: number
): number {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Add tax
  const tax = Math.round(subtotal * taxRate)
  
  // Return total
  return subtotal + tax + shippingCost
}
\`\`\`

### API Documentation
\`\`\`typescript
/**
 * @api {get} /api/products Get Products
 * @apiName GetProducts
 * @apiGroup Products
 * 
 * @apiParam {Number} [page=1] Page number
 * @apiParam {Number} [limit=10] Items per page
 * @apiParam {String} [category] Filter by category
 * 
 * @apiSuccess {Object[]} products List of products
 * @apiSuccess {String} products.id Product ID
 * @apiSuccess {String} products.name Product name
 * @apiSuccess {Number} products.price Price in cents
 * 
 * @apiError {Object} error Error object
 * @apiError {String} error.message Error message
 */
\`\`\`

## 🐛 Bug Reports

### Bug Report Template
\`\`\`markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., 1.0.0]

**Screenshots**
If applicable, add screenshots.

**Additional Context**
Any other context about the problem.
\`\`\`

## ✨ Feature Requests

### Feature Request Template
\`\`\`markdown
**Feature Description**
A clear description of the feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots.
\`\`\`

## 🔍 Code Review Process

### What We Look For
- Code quality and readability
- Performance implications
- Security considerations
- Test coverage
- Documentation updates
- Breaking changes

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact is acceptable
- [ ] Security best practices followed

## 🏷️ Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Release notes prepared

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines

### Communication
- Use clear, descriptive commit messages
- Provide context in pull requests
- Be responsive to feedback
- Ask questions when unclear

## 📞 Getting Help

### Resources
- [Project Documentation](README.md)
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)

### Contact
- Create an issue for bugs or features
- Join our Discord for discussions
- Email: contributors@yourplatform.com

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (if applicable)

Thank you for contributing to making this platform better! 🚀
