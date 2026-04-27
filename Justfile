# swapchat2 client Justfile

set dotenv-load := true
set dotenv-filename := ".env.test"
set export

# Gnosis Chain contracts
POSTAGE := "0x45a1502382541Cd610CC9068e88727426b696293"
BZZ     := "0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da"
RPC     := "https://rpc.gnosis.gateway.fm"

SIGNER_KEY     := env("VITE_BEE_SIGNER_KEY")
STAMP_ID       := env("VITE_BEE_STAMP", "")
STAMP_DEPTH    := "20"
STAMP_AMOUNT   := "1000000000"
BUCKET_DEPTH   := "16"

default:
    @just --list

# Show signer wallet address and balances
balances:
    #!/usr/bin/env bash
    ADDR=$(cast wallet address --private-key $VITE_BEE_SIGNER_KEY 2>/dev/null)
    BZZ_BAL=$(cast call {{BZZ}} "balanceOf(address)(uint256)" $ADDR --rpc-url {{RPC}} 2>/dev/null)
    XDAI=$(cast balance $ADDR --rpc-url {{RPC}} --ether 2>/dev/null)
    echo "Signer:  $ADDR"
    echo "BZZ:     $BZZ_BAL"
    echo "xDAI:    $XDAI"

# Check stamp on-chain
check-stamp id=STAMP_ID:
    @echo "Checking stamp {{id}}..."
    @cast call {{POSTAGE}} "batches(bytes32)(address,uint8,bool,uint256)" 0x{{id}} --rpc-url {{RPC}} 2>/dev/null \
        | awk 'NR==1{owner=$0} NR==2{depth=$0} NR==3{immut=$0} NR==4{bal=$0} END{if(owner=="0x0000000000000000000000000000000000000000") print "DEAD"; else printf "owner=%s depth=%s immutable=%s normBal=%s\n",owner,depth,immut,bal}'

# Buy a new stamp
buy-stamp amount=STAMP_AMOUNT depth=STAMP_DEPTH:
    #!/usr/bin/env bash
    set -e
    ADDR=$(cast wallet address --private-key $VITE_BEE_SIGNER_KEY 2>/dev/null)
    TOTAL_COST=$(python3 -c "print({{amount}} * (2 ** {{depth}}))")
    echo "Signer: $ADDR"
    echo "Cost:   $TOTAL_COST BZZ-plurs (amount={{amount}} depth={{depth}})"
    echo ""
    echo "Approving BZZ spend..."
    cast send {{BZZ}} "approve(address,uint256)" {{POSTAGE}} $TOTAL_COST \
        --private-key $VITE_BEE_SIGNER_KEY --rpc-url {{RPC}} --quiet 2>/dev/null
    NONCE=$(openssl rand -hex 32)
    echo "Buying stamp (nonce=$NONCE)..."
    TX=$(cast send {{POSTAGE}} \
        "createBatch(address,uint256,uint8,uint8,bytes32,bool)" \
        $ADDR {{amount}} {{depth}} {{BUCKET_DEPTH}} 0x$NONCE false \
        --private-key $VITE_BEE_SIGNER_KEY --rpc-url {{RPC}} --json 2>/dev/null)
    BATCH_ID=$(echo $TX | python3 -c "
    import json,sys
    tx = json.load(sys.stdin)
    for log in tx['logs']:
        if log['address'].lower() == '{{POSTAGE}}'.lower():
            print(log['topics'][1][2:])
            break
    ")
    echo ""
    echo "Batch ID: $BATCH_ID"
    echo ""
    echo "Update .env and .env.test:"
    echo "  VITE_BEE_STAMP=$BATCH_ID"

# Dev server
dev:
    npm run dev

# Run e2e tests
test:
    npx playwright test

# Run e2e tests headed
test-headed:
    npx playwright test --headed

# Production build
build:
    npx vite build
