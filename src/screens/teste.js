fetch("https://api.openai.com/v1/models", {
  headers: { Authorization: `Bearer SUA_API_KEY` }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
