default:
    @just --list

release version:
    #!/bin/bash
    git tag {{version}}
    git push --tags