#!/bin/bash
#
# Quick wrapper for scrape-image.mjs
# Usage: ./scripts/add-image.sh <path-to-post.md>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.." || exit 1

if [ $# -eq 0 ]; then
    echo "Usage: ./scripts/add-image.sh <path-to-post.md>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/add-image.sh src/content/blog/my-post.md"
    echo "  ./scripts/add-image.sh src/content/blog/my-post.md --dry-run"
    echo "  ./scripts/add-image.sh src/content/blog/my-post.md --query 'AI technology'"
    exit 1
fi

node scripts/scrape-image.mjs "$@"
