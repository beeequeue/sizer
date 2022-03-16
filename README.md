# Sizer CLI

## Installation

Install it from npm:

```
npm i -g @beequeue/sizer
```

Or (not recommended) download one of the binaries in [the Releases tab](https://github.com/BeeeQueue/sizer/releases).

## Usage

```
Usage: sizer [options] <glob>

Arguments:
  glob               File path glob to analyze

Options:
  -V, --version      output the version number
  -s, --sort <type>  Change how files are sorted in the output (choices: "size-asc", "size-desc", "name-asc",
                     "name-desc", default: "size-desc")
  -B, --brotli       Compress using Brotli (slow!)
  --json             Output in JSON format
  -h, --help         display help for command
```

<details>
<summary>Example output</summary>

```
❯ sizer dist/**/*.js
Path                                          Size      Gzip     Diff%
----                                          ----      ----     -----
dist/assets/vendor.a06e18d4.js                144.79KB  47.58KB  -67%
dist/assets/index.2143eba7.js                 18.17KB   7.79KB   -57%
dist/sw.js                                    16.24KB   5.6KB    -66%
dist/assets/virtual_pwa-register.69ec1145.js  5.81KB    2.42KB   -58%
-----                                         ------    ------   ----
Total                                         185KB     63.38KB  -66%
```

</details>
