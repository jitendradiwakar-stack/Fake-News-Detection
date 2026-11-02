const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'node_modules', 'rollup', 'dist', 'native.js');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('@rollup/wasm-node')) {
    content = content.replace(
      'const requireWithFriendlyError = id => {\n\ttry {\n\t\treturn require(id);\n\t} catch (error) {',
      'const requireWithFriendlyError = id => {\n\ttry {\n\t\treturn require(id);\n\t} catch (error) {\n\t\ttry { return require("@rollup/wasm-node/dist/native.js"); } catch (e) {}\n'
    );
    fs.writeFileSync(file, content);
    console.log('Successfully patched Rollup to use @rollup/wasm-node fallback.');
  }
}
