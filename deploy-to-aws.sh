#!/bin/bash

# TRESR Backend AWS Deployment Script
# Deploys to existing AWS infrastructure to save costs

echo "🚀 TRESR Backend AWS Deployment"
echo "================================"

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o 'AWSCLIV2.pkg'"
    echo "sudo installer -pkg AWSCLIV2.pkg -target /"
    exit 1
fi

# Set variables
REGION=${AWS_REGION:-"us-east-1"}
APP_NAME="tresr-shopify-backend"
ECR_REPO="tresr-backend"
ECS_CLUSTER="tresr-cluster"
ECS_SERVICE="tresr-shopify-service"

echo "📍 Region: $REGION"
echo "📦 App: $APP_NAME"

# Step 1: Build Docker image
echo -e "\n🔨 Building Docker image..."
docker build -t $APP_NAME .

# Step 2: Check if ECR repository exists
echo -e "\n🔍 Checking ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO --region $REGION 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPO --region $REGION
fi

# Step 3: Get ECR login token
echo -e "\n🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# Step 4: Tag and push image
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO"

echo -e "\n📤 Pushing to ECR..."
docker tag $APP_NAME:latest $ECR_URI:latest
docker push $ECR_URI:latest

# Step 5: Update ECS service (if exists)
echo -e "\n🔄 Checking ECS service..."
aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $REGION 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Updating ECS service..."
    aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $REGION
else
    echo "⚠️  No ECS service found. Options:"
    echo "1. Deploy to existing EC2 instance"
    echo "2. Create new ECS service"
    echo "3. Use AWS App Runner (serverless)"
    echo "4. Deploy to Elastic Beanstalk"
fi

# Step 6: Alternative - Deploy to EC2 directly
echo -e "\n💡 Alternative: Deploy directly to EC2"
echo "Looking for existing instances..."
INSTANCES=$(aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0],PublicIpAddress]' --output text --region $REGION)

if [ ! -z "$INSTANCES" ]; then
    echo "Found running instances:"
    echo "$INSTANCES"
    echo -e "\nTo deploy to an instance:"
    echo "1. SSH into the instance"
    echo "2. Pull the Docker image from ECR"
    echo "3. Run: docker run -d -p 80:3001 --env-file .env $ECR_URI:latest"
fi

echo -e "\n✅ Deployment preparation complete!"
echo -e "\n📋 Next steps:"
echo "1. Choose deployment target (ECS, EC2, or App Runner)"
echo "2. Set environment variables"
echo "3. Update backend URL in Shopify theme"
echo "4. Test authentication flow"

# Cost optimization reminders
echo -e "\n💰 Cost Optimization Checklist:"
echo "[ ] Shut down unused EC2 instances"
echo "[ ] Delete old ECS services"
echo "[ ] Clean up unused S3 buckets"
echo "[ ] Switch DynamoDB to on-demand pricing"
echo "[ ] Remove unused Elastic IPs"
echo "[ ] Delete old CloudFormation stacks"