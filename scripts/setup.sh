#!/bin/bash

# athenahealth MCP Server Setup Script
# This script helps set up the development environment and configuration

set -e

echo "🏥 athenahealth MCP Server Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18.0.0 or later.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is not supported. Please install Node.js $REQUIRED_VERSION or later.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $NODE_VERSION is installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm is installed${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Create logs directory
echo -e "${BLUE}📁 Creating logs directory...${NC}"
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Create environment file from template
if [ ! -f .env ]; then
    echo -e "${BLUE}🔧 Creating environment configuration...${NC}"
    cp config/environment.example .env
    echo -e "${GREEN}✅ Environment file created (.env)${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your athenahealth API credentials${NC}"
else
    echo -e "${YELLOW}⚠️  Environment file (.env) already exists${NC}"
fi

# Generate encryption key for development
if [ ! -f .env ] || ! grep -q "ENCRYPTION_KEY=" .env; then
    echo -e "${BLUE}🔐 Generating encryption key...${NC}"
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env
    echo -e "${GREEN}✅ Encryption key generated and added to .env${NC}"
fi

# Build the project
echo -e "${BLUE}🔨 Building the project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Project built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build project${NC}"
    exit 1
fi

# Run linter
echo -e "${BLUE}🔍 Running linter...${NC}"
npm run lint

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting warnings detected${NC}"
fi

# Display setup completion
echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. ${YELLOW}Edit .env file${NC} with your athenahealth API credentials:"
echo -e "   - ATHENA_CLIENT_ID"
echo -e "   - ATHENA_CLIENT_SECRET"
echo -e "   - ATHENA_BASE_URL"
echo -e "   - ATHENA_PRACTICE_ID"
echo ""
echo -e "2. ${YELLOW}Start the development server:${NC}"
echo -e "   npm run dev"
echo ""
echo -e "3. ${YELLOW}Or start the production server:${NC}"
echo -e "   npm start"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   - README.md for detailed setup instructions"
echo -e "   - config/environment.example for all configuration options"
echo ""
echo -e "${BLUE}🔒 Security Notes:${NC}"
echo -e "   - Never commit your .env file to version control"
echo -e "   - Use strong encryption keys in production"
echo -e "   - Review HIPAA compliance guidelines in README.md"
echo ""
echo -e "${BLUE}🏥 athenahealth API Setup:${NC}"
echo -e "   - Visit https://www.athenahealth.com/developer-portal"
echo -e "   - Create a developer account and request sandbox access"
echo -e "   - Create an API application to get your credentials"
echo ""

# Check if required environment variables are set
echo -e "${BLUE}🔍 Checking environment configuration...${NC}"

if [ -f .env ]; then
    source .env
    
    missing_vars=()
    
    if [ -z "$ATHENA_CLIENT_ID" ] || [ "$ATHENA_CLIENT_ID" = "your_client_id_here" ]; then
        missing_vars+=("ATHENA_CLIENT_ID")
    fi
    
    if [ -z "$ATHENA_CLIENT_SECRET" ] || [ "$ATHENA_CLIENT_SECRET" = "your_client_secret_here" ]; then
        missing_vars+=("ATHENA_CLIENT_SECRET")
    fi
    
    if [ -z "$ATHENA_BASE_URL" ] || [ "$ATHENA_BASE_URL" = "https://api.athenahealth.com" ]; then
        missing_vars+=("ATHENA_BASE_URL")
    fi
    
    if [ -z "$ATHENA_PRACTICE_ID" ] || [ "$ATHENA_PRACTICE_ID" = "your_practice_id_here" ]; then
        missing_vars+=("ATHENA_PRACTICE_ID")
    fi
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required environment variables are configured${NC}"
        echo ""
        echo -e "${GREEN}🚀 You can now start the server with: npm start${NC}"
    else
        echo -e "${YELLOW}⚠️  The following environment variables need to be configured:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "   - $var"
        done
        echo ""
        echo -e "${YELLOW}Please edit .env file with your athenahealth API credentials${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}" 