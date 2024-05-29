const totalAdminsInput = document.getElementById("totalAdminsInput");
const totalClientsInput = document.getElementById("totalClientsInput");
const adminNames = document.getElementById("adminNames");

const getLogButton = document.getElementById("getLogButton");


const getlogs=async()=>{
    const response = await axios.post('/logs',{});
    if(response.data.success === true){
        const data = response.data.data;
        totalAdminsInput.value = data.totalAdmins;
        totalClientsInput.value = data.totalClients;
        adminNames.innerHTML = ""
        data.allAdmins.forEach(element => {
            adminNames.innerHTML+=`<li class="list-group-item" value="${element}">${element}   <i class="bi bi-slash-circle ban" onclick="blacklistUser('${element}')"></i></li>`
        });

    }
}
getlogs()

getLogButton.addEventListener('click',()=>{getlogs()})

const blacklistUser=(value)=>{
    console.log(`selected ${value}`)
}