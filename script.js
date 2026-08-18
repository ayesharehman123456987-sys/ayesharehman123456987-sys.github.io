const buttons = document.querySelectorAll('.nav');
const pages = document.querySelectorAll('.page');
const title = document.getElementById('title');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {

    let id = btn.dataset.page;

    pages.forEach(page => {
      page.classList.remove('active');
    });

    let selected = document.getElementById(id);
    if(selected){
      selected.classList.add('active');
    }

    buttons.forEach(b => {
      b.classList.remove('active');
    });

    btn.classList.add('active');

    if(title){
      title.innerText = id.charAt(0).toUpperCase() + id.slice(1);
    }

  });
});


document.querySelectorAll('[data-go]').forEach(btn => {

  btn.onclick = () => {

    let id = btn.dataset.go;

    pages.forEach(page => {
      page.classList.remove('active');
    });

    let selected = document.getElementById(id);

    if(selected){
      selected.classList.add('active');
    }

  };

});
