# Azure Deployment Instructions

## Prerequisites
Azure CLI installed (version 2.49.0 or later recommended).
Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

- Active Azure subscription with permissions to create resources and assign roles.
- Logged into Azure CLI via `az login`.
- Basic familiarity with shell/bash scripting or CLI usage.
- Optionally, GitHub account if you plan to use service principal with GitHub Actions.

## Set environment variables

```bash
LOCATION="eastus2"
ENVIRONMENT="prod"
PREFIX="inheir"
SUBSCRIPTION_ID="<your-subscription-id>"

RESOURCE_GROUP="${PREFIX}-${ENVIRONMENT}-rg-eus2-001"
AIH_NAME="${PREFIX}-${ENVIRONMENT}-aih-eus2-001"
AIP_NAME="${PREFIX}-${ENVIRONMENT}-aip-eus2-001"
STORAGE_ACCOUNT="${PREFIX}stacc001"
CONTAINER_NAME="knowledgebase"
SEARCH_SERVICE="${PREFIX}-${ENVIRONMENT}-ais-eus2-001"
COSMOS_NAME="${PREFIX}"
SP_NAME="ga-${PREFIX}-deployment"
```

## Login and select subscription

```bash
az login
az account set --subscription $SUBSCRIPTION_ID
```

## Create resource group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

## Create service principal for GitHub Actions (if you're modifying the source code)

```bash
az ad sp create-for-rbac \
  --name $SP_NAME \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP
```

## Add Azure ML extension

```bash
az extension add --name ml
```

## Create AI Foundry hub workspace

```bash
az ml workspace create --kind hub \
  --name $AIH_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --tags environment=$ENVIRONMENT
```

## Create AI Foundry project workspace

```bash
HUB_ID="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.MachineLearningServices/workspaces/${AIH_NAME}"

az ml workspace create --kind project \
  --name $AIP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hub-id $HUB_ID \
  --tags environment=$ENVIRONMENT
```

## Create Azure AI Search resource

```bash
az search service create \
  --name $SEARCH_SERVICE \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku free \
  --tags environment=$ENVIRONMENT
```

## Create storage account

```bash
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --tags environment=$ENVIRONMENT
```

## Get storage account key

```bash
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" -o tsv)
```

## Create storage container

```bash
az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access container
```

## Register Cosmos DB provider and create Cosmos DB account

```bash
az provider register --namespace Microsoft.DocumentDB

az cosmosdb create \
  --name $COSMOS_NAME \
  --resource-group $RESOURCE_GROUP \
  --kind MongoDB \
  --locations regionName=$LOCATION failoverPriority=0 isZoneRedundant=false \
  --default-consistency-level Session \
  --tags environment=$ENVIRONMENT
```

## Model deployment

Use this for deploying the text-embedding-ada-002 and openai-gpt-4o-mini models for the platform to work. You can swap OpenAI GPT 4o Mini model for other models as well.

```bash
az ml model create \
  --name your-model-name \
  --path ./model \
  --workspace-name $AIP_NAME \
  --resource-group $RESOURCE_GROUP

# Deploy endpoint and deployment using configuration files (endpoint.yml and deployment.yml)
```
