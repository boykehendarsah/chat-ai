const message = "Halo kelas AVPN Batch 26~~";

console.log(message);

// string  --> "Halo", 'Halo', `Halo`
//         --> `` --> bisa sematkan variable (variable == wadah)
// angka   --> 1000, 1_000, 1.01
// boolean --> true, false
// array   --> [] --> bisa sematkan deretan nilai yang tipenya itu sama
//         --> [ 1, 2, 3 ]
// object  --> {} --> variable dalam variable
//         --> { nama: "Budi" }
// special --> null

// struktur function
function greetings(name) {
  console.log(`Halo, ${name}!`);
}

// cara menjalankan function
greetings("Arif");
greetings("Alfiah");
greetings("Miqdad");
greetings("Fardi");
