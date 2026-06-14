/*
 * Footballer database for the name-chain game.
 *
 * Each entry is a full name. The game treats the LAST word as the surname,
 * and the chain links the first letter of one player's surname to the first
 * letter of the next player's name (see README for the rules).
 *
 * Weighted towards English / Premier League names (where the nostalgia lives)
 * but with plenty of international legends so the chain rarely dead-ends.
 * Add more names here any time — the game picks them up automatically.
 */
const PLAYERS = [
  // ---- England / Premier League legends ----
  "David Beckham", "Bryan Robson", "Rob Green", "Gary Neville", "Phil Neville",
  "Paul Scholes", "Ryan Giggs", "Roy Keane", "Eric Cantona", "Peter Schmeichel",
  "Wayne Rooney", "Steven Gerrard", "Frank Lampard", "John Terry", "Ashley Cole",
  "Rio Ferdinand", "Sol Campbell", "Gary Cahill", "Joe Cole", "Michael Owen",
  "Alan Shearer", "Teddy Sheringham", "Andy Cole", "Dwight Yorke", "Robbie Fowler",
  "Jamie Carragher", "Xabi Alonso", "Fernando Torres", "Luis Suarez", "Jamie Vardy",
  "Harry Kane", "Dele Alli", "Hugo Lloris", "Son Heungmin", "Gareth Bale",
  "Aaron Ramsey", "Cesc Fabregas", "Thierry Henry", "Patrick Vieira", "Dennis Bergkamp",
  "Robert Pires", "Freddie Ljungberg", "Sol Bamba", "Tony Adams", "David Seaman",
  "Ian Wright", "Paul Merson", "Ray Parlour", "Marc Overmars", "Nicolas Anelka",
  "Didier Drogba", "Petr Cech", "Michael Essien", "Claude Makelele", "Ashley Young",
  "Antonio Valencia", "Nemanja Vidic", "Patrice Evra", "Edwin van der Sar", "Park Jisung",
  "Carlos Tevez", "Sergio Aguero", "David Silva", "Yaya Toure", "Vincent Kompany",
  "Joe Hart", "Pablo Zabaleta", "Raheem Sterling", "Kevin De Bruyne", "Riyad Mahrez",
  "Ngolo Kante", "Eden Hazard", "Diego Costa", "Cesar Azpilicueta", "Thibaut Courtois",
  "Mohamed Salah", "Sadio Mane", "Roberto Firmino", "Virgil van Dijk", "Trent Alexander-Arnold",
  "Andy Robertson", "Jordan Henderson", "Alisson Becker", "Bukayo Saka", "Marcus Rashford",
  "Phil Foden", "Jack Grealish", "Mason Mount", "Declan Rice", "Jude Bellingham",
  "Jadon Sancho", "Reece James", "Ben White", "Harry Maguire", "Kalvin Phillips",
  "Jordan Pickford", "Kyle Walker", "John Stones", "Luke Shaw", "Eric Dier",

  // ---- England nostalgia (90s / earlier) ----
  "Paul Gascoigne", "Gary Lineker", "Chris Waddle", "Stuart Pearce", "David Platt",
  "Des Walker", "John Barnes", "Peter Beardsley", "Tony Cottee", "Matthew Le Tissier",
  "Les Ferdinand", "Ian Rush", "Kenny Dalglish", "Graeme Souness", "Alan Hansen",
  "Bryan Gunn", "Nigel Winterburn", "Lee Dixon", "Steve Bould", "Martin Keown",
  "Emile Heskey", "Darius Vassell", "Kieron Dyer", "Nicky Butt", "David James",

  // ---- Spain / La Liga ----
  "Lionel Messi", "Andres Iniesta", "Xavi Hernandez", "Carles Puyol", "Gerard Pique",
  "Sergio Busquets", "Sergio Ramos", "Iker Casillas", "Raul Gonzalez", "Fernando Hierro",
  "David Villa", "Pedro Rodriguez", "Jordi Alba", "Marc Bartra", "Victor Valdes",
  "Karim Benzema", "Luka Modric", "Toni Kroos", "Marcelo Vieira", "Isco Alarcon",
  "Gareth Southgate", "Antoine Griezmann", "Ousmane Dembele", "Frenkie de Jong", "Ronald Araujo",

  // ---- Portugal ----
  "Cristiano Ronaldo", "Luis Figo", "Rui Costa", "Nuno Gomes", "Pauleta",
  "Deco Souza", "Ricardo Carvalho", "Pepe Pereira", "Bruno Fernandes", "Bernardo Silva",
  "Joao Felix", "Diogo Jota", "Ruben Dias", "Joao Cancelo", "Rui Patricio",

  // ---- Brazil ----
  "Ronaldinho", "Ronaldo Nazario", "Rivaldo Borba", "Kaka", "Roberto Carlos",
  "Cafu", "Dida", "Adriano", "Robinho", "Neymar",
  "Dani Alves", "Thiago Silva", "Marquinhos", "Casemiro", "Vinicius Junior",
  "Gabriel Jesus", "Richarlison", "Philippe Coutinho", "Alex Sandro", "Ederson Moraes",

  // ---- Argentina ----
  "Diego Maradona", "Gabriel Batistuta", "Juan Riquelme", "Hernan Crespo", "Javier Zanetti",
  "Walter Samuel", "Esteban Cambiasso", "Angel Di Maria", "Gonzalo Higuain", "Javier Mascherano",
  "Paulo Dybala", "Lautaro Martinez", "Emiliano Martinez", "Rodrigo De Paul", "Nicolas Otamendi",

  // ---- France ----
  "Zinedine Zidane", "Marcel Desailly", "Lilian Thuram", "Fabien Barthez", "Youri Djorkaeff",
  "Emmanuel Petit", "David Trezeguet", "Franck Ribery", "Kylian Mbappe", "Paul Pogba",
  "Olivier Giroud", "Raphael Varane", "Hugo Lloris", "Aurelien Tchouameni", "Eduardo Camavinga",

  // ---- Italy ----
  "Paolo Maldini", "Alessandro Nesta", "Fabio Cannavaro", "Gianluigi Buffon", "Francesco Totti",
  "Andrea Pirlo", "Alessandro Del Piero", "Filippo Inzaghi", "Gennaro Gattuso", "Daniele De Rossi",
  "Giorgio Chiellini", "Leonardo Bonucci", "Marco Verratti", "Lorenzo Insigne", "Federico Chiesa",

  // ---- Germany ----
  "Oliver Kahn", "Michael Ballack", "Miroslav Klose", "Lukas Podolski", "Bastian Schweinsteiger",
  "Philipp Lahm", "Manuel Neuer", "Mesut Ozil", "Thomas Muller", "Mats Hummels",
  "Jerome Boateng", "Marco Reus", "Toni Kroos", "Joshua Kimmich", "Kai Havertz",

  // ---- Netherlands ----
  "Dennis Bergkamp", "Marc Overmars", "Edgar Davids", "Clarence Seedorf", "Patrick Kluivert",
  "Ruud van Nistelrooy", "Arjen Robben", "Robin van Persie", "Wesley Sneijder", "Rafael van der Vaart",
  "Memphis Depay", "Georginio Wijnaldum", "Matthijs de Ligt", "Frenkie de Jong", "Cody Gakpo",

  // ---- Other greats / variety to keep chains alive ----
  "George Weah", "Samuel Etoo", "Yaya Toure", "Jay Jay Okocha", "Nwankwo Kanu",
  "Michael Essien", "Asamoah Gyan", "Mohamed Aboutrika", "Sadio Mane", "Riyad Mahrez",
  "Zlatan Ibrahimovic", "Henrik Larsson", "Andriy Shevchenko", "Hristo Stoichkov", "Pavel Nedved",
  "Luka Modric", "Davor Suker", "Robert Lewandowski", "Erling Haaland", "Martin Odegaard",
  "Heung Min Son", "Shinji Kagawa", "Keisuke Honda", "Hidetoshi Nakata", "Park Jisung",
];
