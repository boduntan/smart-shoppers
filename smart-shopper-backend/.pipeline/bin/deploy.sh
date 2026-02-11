#!/bin/bash

CONFIG_DIR='../../apim'
ENV=$1
API_NAME=$2

# create conf/deploy directory if doesn't already exist
if [ ! -d "${CONFIG_DIR}/deploy" ]; then
  mkdir -p "${CONFIG_DIR}/deploy"
fi

info() {
  printf '\n--\n%s\n--\n\n' "$*";
}

deploy_api() {
  info "==> Preparing config files for ${API_NAME}..."

  if [ -d "${CONFIG_DIR}/files/${API_NAME}" ]; then
    info '======> Copying files...'
    cp -Rv ${CONFIG_DIR}/files/${API_NAME}/ \
      ${CONFIG_DIR}/deploy/${API_NAME}/
  fi

  for templatefile in `ls ${CONFIG_DIR}/templates/${API_NAME}/`; do
    if [ -s "${CONFIG_DIR}/templates/${API_NAME}/${templatefile}" ]; then
      info '======> Generating ${templatefile}...'
      render \
        --config ${CONFIG_DIR}/environments/global.yaml \
        --config ${CONFIG_DIR}/environments/${API_NAME}/api.yaml \
        --config ${CONFIG_DIR}/environments/${API_NAME}/${ENV}/env.yaml \
        --in ${CONFIG_DIR}/templates/${API_NAME}/${templatefile} \
        --out ${CONFIG_DIR}/deploy/${API_NAME}/${templatefile}
    fi
  done

  info "==> Completed config generation for ${API_NAME}."

  info "==> Generating ARM templates for ${API_NAME}..."

  # create deploy/<api_name>/output directory if doesn't already exist
  if [ ! -d "${CONFIG_DIR}/deploy/${API_NAME}/output" ]; then
    mkdir -p "${CONFIG_DIR}/deploy/${API_NAME}/output"
  fi

  cd ${CONFIG_DIR}/deploy/${API_NAME}/

  chmod +x deploy.sh
  apim-templates create --configFile ./api-config.yml

  info "==> Completed ARM templates generation for ${API_NAME}."

  info "==> Run ARM templates deployment script for ${API_NAME}..."

  # ./deploy.sh

  info "==> Completed ARM templates deployment script for ${API_NAME}..."
}

deploy_api
