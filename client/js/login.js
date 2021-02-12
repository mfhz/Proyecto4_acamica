const login = document.querySelector('#form');
const API = 'http://localhost:3000/warehouse/v1/users/login';




// const API = new URL('https://rickandmortyapi.com/api/character/');
login.addEventListener('submit', succesLogin);


async function succesLogin(e) {
    e.preventDefault();
    const username = document.querySelector('#nombre').value;
    const pass = document.querySelector('#contrasena').value;
    const params = {
        method: 'POST',
        body: JSON.stringify({
            email: username,
            pass: pass
        }),
        headers: {
            "Content-type": "application/json"
        }
    }

    fetch(`${API}`, params)        
        .then((success) => {
            if (success.ok) {
                return success.json();
            }
        })
        .then((data) => {
            guardarLS(data.token);
            // window.location.href = '';         
        })
        .catch((err) => {
            console.log(err);
        });


}


function guardarLS(user) {
    const token = {
        token: user
    };

    localStorage.setItem('token', JSON.stringify(token));
}
