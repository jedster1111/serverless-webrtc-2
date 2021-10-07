#!/bin/bash

set -e

# Always run script relative to this script's location, rather than from where it was invoked.
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "${parent_path}/.."

DEFAULT_VERSION_TYPE="patch"

VERSION_TYPE="${1:-$DEFAULT_VERSION_TYPE}"

echo "Version bump type: $VERSION_TYPE"

if ! [[ ${VERSION_TYPE} =~ ^(patch|minor|major)$ ]]; then
  echo "Version type was not one of 'patch', 'minor' or 'major'."
  echo "Exiting!"
  exit 1
fi

cd packages/serverless-webrtc

echo "Bumping package.json version."
NEW_VERSION=$(npm version $VERSION_TYPE)

echo "Package bumped to version: ${NEW_VERSION}."

echo "Commiting..."
git add package.json
git commit -m "Bump version to ${NEW_VERSION}"

echo "Tagging commit with ${NEW_VERSION}."
git tag $NEW_VERSION

echo "Pushing..."
git push --follow-tags
