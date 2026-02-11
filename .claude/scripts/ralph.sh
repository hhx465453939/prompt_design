#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# This script is designed to be called from .claude/scripts/ in any project
# Usage: bash .claude/scripts/ralph.sh [max_iterations]

set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get project root (parent of .claude directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")/.."

# Files in project root
PRD_FILE="$PROJECT_ROOT/prd.json"
PROGRESS_FILE="$PROJECT_ROOT/prd-progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/../archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

# Prompt file in .claude/scripts/
PROMPT_FILE="$SCRIPT_DIR/prompt.md"

echo "Project root: $PROJECT_ROOT"
echo "Script dir: $SCRIPT_DIR"

# Check if prd.json exists
if [ ! -f "$PRD_FILE" ]; then
  echo "Error: prd.json not found at $PRD_FILE"
  echo "Please use /ralph skill to create prd.json first"
  exit 1
fi

# Check if prompt.md exists
if [ ! -f "$PROMPT_FILE" ]; then
  echo "Error: prompt.md not found at $PROMPT_FILE"
  exit 1
fi

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Ralph - Autonomous Agent Loop"
echo "═══════════════════════════════════════════════════════"
echo "Max iterations: $MAX_ITERATIONS"
echo "PRD file: $PRD_FILE"
echo "Progress file: $PROGRESS_FILE"
echo "═══════════════════════════════════════════════════════"
echo ""

# Change to project root for Amp execution
cd "$PROJECT_ROOT"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════════════════"

  # Run amp with the ralph prompt
  OUTPUT=$(cat "$PROMPT_FILE" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  Ralph completed all tasks!"
    echo "═══════════════════════════════════════════════════════"
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    echo ""
    echo "Check progress: cat $PROGRESS_FILE"
    echo "Check git log: git log --oneline -10"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Ralph reached max iterations"
echo "═══════════════════════════════════════════════════════"
echo "Max iterations ($MAX_ITERATIONS) reached without completing all tasks."
echo ""
echo "Check status:"
echo "  cat $PROGRESS_FILE"
echo "  cat $PRD_FILE | jq '.userStories[] | {id, title, passes}'"
exit 1
