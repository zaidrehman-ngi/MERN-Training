import axios from "axios";

// const response = await axios.get("http://localhost:3000/a");

const response = await axios.get("http://localhost:3000/a", {
  maxRedirects: 5,
});

console.log(response.data);
