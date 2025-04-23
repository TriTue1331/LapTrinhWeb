document.addEventListener("DOMContentLoaded", function () {
  fetch("/dsPET")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.querySelector("tbody");
      tableBody.innerHTML = "";

      data.forEach((pet) => {
        const price = pet.Price ? pet.Price.toLocaleString() + " VND" : "N/A"; // Kiểm tra nếu Price undefined

        const row = `
                    <tr>
                        <td>${pet.ID || "N/A"}</td>
                        <td>${pet.Name || "N/A"}</td>
                        <td><img src="/image/${
                          pet.Image || "default.jpg"
                        }" width="50"></td>
                        <td>${pet.Age || "N/A"}</td>
                        <td>${price}</td>
                        <td>${pet.Species || "N/A"}</td>
                        <td>${pet.Gender || "N/A"}</td>
                        <td>${pet.Describe || "N/A"}</td>
                    </tr>
                `;
        tableBody.innerHTML += row;
      });
    })
    .catch((error) => console.error("Lỗi khi tải dữ liệu:", error));
});
