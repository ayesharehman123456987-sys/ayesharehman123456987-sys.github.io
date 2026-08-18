const buttons = document.querySelectorAll(".nav");
const pages = document.querySelectorAll(".page");
const title = document.getElementById("title");

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const pageId = button.dataset.page;

        pages.forEach(page => {
            page.classList.remove("active");
        });

        const page = document.getElementById(pageId);

        if(page){
            page.classList.add("active");
        }

        buttons.forEach(btn=>{
            btn.classList.remove("active");
        });

        button.classList.add("active");

        if(title){
            title.innerText =
            pageId.charAt(0).toUpperCase() + pageId.slice(1);
        }

    });

});


document.querySelectorAll("[data-go]").forEach(button=>{

    button.addEventListener("click",()=>{

        const pageId = button.dataset.go;

        pages.forEach(page=>{
            page.classList.remove("active");
        });

        const page = document.getElementById(pageId);

        if(page){
            page.classList.add("active");
        }

    });

});
