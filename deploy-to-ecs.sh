#!/bin/bash

# Deploy TRESR Shopify Backend to existing ECS infrastructure

echo "🚀 Deploying to AWS ECS Fargate"
echo "================================"

# Variables
AWS_REGION="us-east-1"
AWS_ACCOUNT="058264525444"
ECR_REPO="tresr-shopify-backend"
CLUSTER="storefront-backend-cluster"
SERVICE="tresr-shopify-service"
TASK_FAMILY="tresr-shopify-backend"

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t $ECR_REPO .

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository..."
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION 2>/dev/null || true

# Tag and push image
echo "📤 Pushing image to ECR..."
docker tag $ECR_REPO:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Create task definition
echo "📝 Creating task definition..."
cat > task-definition.json <<EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "tresr-shopify-backend",
      "image": "$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"}
      ],
      "secrets": [
        {"name": "SHOPIFY_STORE_DOMAIN", "valueFrom": "arn:aws:ssm:$AWS_REGION:$AWS_ACCOUNT:parameter/tresr/shopify/store_domain"},
        {"name": "SHOPIFY_API_ACCESS_TOKEN", "valueFrom": "arn:aws:ssm:$AWS_REGION:$AWS_ACCOUNT:parameter/tresr/shopify/api_token"},
        {"name": "DYNAMIC_ENVIRONMENT_ID", "valueFrom": "arn:aws:ssm:$AWS_REGION:$AWS_ACCOUNT:parameter/tresr/dynamic/env_id"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:ssm:$AWS_REGION:$AWS_ACCOUNT:parameter/tresr/jwt_secret"},
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:ssm:$AWS_REGION:$AWS_ACCOUNT:parameter/tresr/database_url"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tresr-shopify-backend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION

# Create service (or update if exists)
echo "🚀 Creating/updating ECS service..."
aws ecs create-service \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --task-definition $TASK_FAMILY \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0123456789abcdef0],securityGroups=[sg-0123456789abcdef0],assignPublicIp=ENABLED}" \
  --region $AWS_REGION 2>/dev/null || \
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition $TASK_FAMILY \
  --force-new-deployment \
  --region $AWS_REGION

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add environment variables to AWS Systems Manager Parameter Store"
echo "2. Update security groups and subnets in the script"
echo "3. Configure load balancer target group"
echo "4. Update Shopify theme with new backend URL"