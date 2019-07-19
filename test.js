let text = "0271898933";
if (text.match(/^[0-9]+$/) && text.length >= 10) {
  console.log("valid")
} else {
  console.log("invalid")
}