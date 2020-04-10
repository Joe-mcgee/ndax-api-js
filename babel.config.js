module.exports =function(api){
  api.cache(true)
  return {
  "presets": [
    "@babel/preset-env" 
  ],
  "plugins": [
    ["@babel/plugin-proposal-class-properties", { "loose": true, }],
  ],
    "ignore": [
      "node_modules"
    ]
  }
}
