#!/bin/sh

ARCH=`uname -s`

if [ "$ARCH" = "Darwin" ]; then
type brew >/dev/null 2>&1 || { echo >&2 "Homebrew not installed. Installing Homebrew..."; ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"; }
brew list boost >/dev/null 2>&1 || { echo >&2 "Dependency BOOST not installed. Installing BOOST..."; brew install boost; }
brew list berkeley-db4 >/dev/null 2>&1 || { echo >&2 "Dependency Berkeley-DB4 not installed. Installing Berkeley-DB4..."; brew install berkeley-db4; }
brew list openssl >/dev/null 2>&1 || { echo >&2 "Dependency OpenSSL not installed. Installing OpenSSL..."; brew install openssl; }
brew list miniupnpc >/dev/null 2>&1 || { echo >&2 "Dependency MiniUPNPc not installed. Installing MiniUPNPc..."; brew install miniupnpc; }
fi

#if [ "$ARCH" = "Linux" ]; then
#	echo ""
#fi

healthcoin=$(ps aux | grep healthcoind | grep -v 'grep' | grep -c 'healthcoind')
healthcoinqt=$(ps aux | grep healthcoin-qt | grep -v 'grep' | grep -c 'healthcoin-qt')
if  [ "$healthcoin" -eq "1" -o "$healthcoinqt" -eq "1" ]; then
echo "1"
else
echo "0"
fi
