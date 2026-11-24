(function(root){
  'use strict';
  // Each scene has a title, a dispatch, and a reveal earned by delivering intact cargo.
  const scenes={
    cutii:[
      ['Coletul de la numărul 0','De sub ultima oală, Tanti Geta scoate un colet sigilat. Pe stradă numerele încep de la 1, dar eticheta spune 0. Geta recunoaște farul de pe etichetă. L-a desenat ea, când era mică.','Pe verso stă scris cu creionul: „Când se aprinde farul, drumul se deschide din nou”. Lângă text sunt trei linii, ca o partitură. Geta știe cui să i le arate.'],
      ['The Parcel from Number Zero','Aunt Geta pulls a sealed parcel out from beneath the last pot. The street starts at number 1, but the label says 0. Geta recognizes the lighthouse on the label. She drew it as a child.','A pencil note on the back says, “When the light comes on, the road opens again.” Three lines beside it look like a musical score. Geta knows who to show it to.']
    ],
    tort:[
      ['Trei bătăi','DJ Covrig încearcă cele trei linii pe o boxă, la repetiție. Îi iese același ritm pe care îl bătea bunicul lui în țeava caloriferului, când voia să-l cheme acasă.','Într-un plic vechi de la bunicul lui găsește același ritm, lângă ora 23:40 și o schiță a parcării. Doru a rămas cu cheile de acolo.'],
      ['Three Knocks','DJ Covrig tries the three lines on a speaker during rehearsal. It is the same rhythm his grandfather used to tap on the radiator pipe when it was time to come home.','In an old envelope from his grandfather, he finds the same rhythm beside 11:40 p.m. and a sketch of the car park. Doru still has its keys.']
    ],
    pepeni:[
      ['Locul rezervat','Doru susține că locul cu cifra 0 nu a fost niciodată pentru parcare. Îți arată vopseaua ascunsă sub un lădoi de pepeni. Cifra are lângă ea o săgeată spre parter.','În spatele săgeții găsești o ușiță pentru predarea sacilor poștali. Ultimul sac din registru era pentru un bloc pe care îl cunoști. Administratorul încă ține cheia.'],
      ['The Reserved Spot','Doru says the spot marked zero was never meant for parking. Under a crate of watermelons, he shows you old paint and an arrow pointing toward the ground floor.','The arrow leads to a hatch for passing mailbags. The last bag in the ledger was meant for a building you know. The caretaker still has the key.']
    ],
    piata:[
      ['Registrul cu două date','Administratorul găsește procesul-verbal de închidere a rutei. Ultima livrare e notată pe aceeași pagină, cu o dată de a doua zi. Cineva a continuat să ducă plicuri.','Pe rândul de a doua zi e inițiala Getei. Administratorul credea că desenul era o mâzgălitură. Acum poți să-i arăți Getei exact unde l-ai găsit.'],
      ['The Ledger with Two Dates','The caretaker finds the record closing the route. The final delivery appears on the same page, dated the following day. Someone kept taking letters out.','Geta’s initial is on the second entry. The caretaker had taken the lighthouse for a doodle. Now you can show Geta exactly where it was found.']
    ],
    vaza:[
      ['Fotografia din vază','Geta își amintește noaptea când apa a luat podul vechi. Ajuta la sortarea plicurilor și a ascuns o fotografie în vaza din hol, ca să nu se ude.','În fotografie, patru oameni predau câte un sac, de la o mașină la alta. Podul căzuse deja. Ruta a funcționat o vreme datorită schimburilor dintre șase opriri.'],
      ['The Photograph in the Vase','Geta remembers the night the flood swept away the old bridge. She helped sort the letters and hid a photograph inside the hall vase to keep it dry.','Four people in the photograph are handing mailbags from one vehicle to the next. The bridge was already gone. For a while, six handover stops kept the route alive.']
    ],
    cartier:[
      ['Prima oprire','La petrecerea blocului, DJ Covrig bate ritmul bunicului. O vecină răspunde bătând de două ori în geam. Își amintește și ce urma după semnal: la prima oprire se lua harta.','Harta s-a rupt pe îndoitură. Jumătatea rămasă arată livezile și cabana, iar pe margine scrie: „Ține plicurile până se întoarce curierul”. Până acum nu s-a întors nimeni.'],
      ['The First Stop','At the block party, DJ Covrig taps his grandfather’s rhythm. A neighbour answers with two knocks on the window. She remembers what came next: the first stop was where the map changed hands.','The map tore along a fold. The surviving half shows the orchards and the cabin. In the margin: “Hold the letters until the courier returns.” Nobody has come back yet.']
    ],
    livada:[
      ['Semne pe lăzi','Meșterul de la târg recunoaște traseul după săgețile de pe lăzile vechi. Bunica lui marca pe fundul fiecărei lăzi oprirea unde lăsase o scrisoare.','Una dintre lăzi a revenit goală din pădure. Pe fund are o scândură nouă, tăiată dintr-un indicator. Pe dos se mai văd trei litere: DEP.'],
      ['Marks on the Crates','A stallholder recognizes the route from the arrows on his old crates. His grandmother marked the bottom of each one with the stop where she had left a letter.','One crate came back empty from the forest. Its new base was cut from a road sign. Three letters are still visible on the back: DEP.']
    ],
    serpentine:[
      ['Lampa de la curbă','Geta își amintește că ultima mașină din pădure a fost văzută la o lampă de lângă curbă. Lampa stă încă acolo, dar o pasăre și-a făcut cuib în cutia ei.','Sub cutie e o tăbliță prinsă cu sârmă: „Am lăsat scrisorile la cabană. Nu treceți podul”. Cineva a salvat sacul înainte ca drumul să se închidă.'],
      ['The Lamp at the Bend','Geta remembers the last car in the forest being spotted by a lamp at a bend. The lamp is still there. A bird has made a nest in its housing.','A plate hangs beneath it on a wire: “Letters left at the cabin. Do not cross the bridge.” Someone saved the bag before the road closed.']
    ],
    cabana:[
      ['Camera cu plicuri','La cabană, vaza are loc pe pervaz. Sub pervaz e o trapă care dă într-o cameră cu plicuri, fiecare legat cu sfoară și însemnat cu oprirea lui.','Plicurile sunt uscate. Lipsește lista destinatarilor, pe care mecanicul a dus-o la depou. În colțul camerei găsești șnurul ei, uns cu ulei de tramvai.'],
      ['The Room of Letters','At the cabin there is space for the vase on the sill. Below it, a hatch leads into a room full of letters. Each bundle is tied with string and marked with its stop.','The letters are dry. The list of recipients is missing. A mechanic took it to the depot, leaving only an oily length of tram cord behind.']
    ],
    depou:[
      ['Sacul care a schimbat linia','Administratorul cheamă mecanicul din tură. Pe hârtia veche, a depoului, scrisorile apar ca o piesă de schimb: „o ladă cu contacte, linia de noapte”.','Sub lădița de scule stă lista, învelită în pânză. La șase adrese scrie „predare la semnal”. Legenda semnalului se citește de pe viaduct.'],
      ['The Bag That Changed Lines','The caretaker calls the mechanic on duty. In the depot’s old paperwork, the letters are listed as a spare part: “one crate of contacts, night line.”','The list is underneath the toolbox, wrapped in cloth. Six entries read “hand over at the signal.” The signal key can be read from the viaduct.']
    ],
    viaduct:[
      ['Inscripția de sub pod','Pe arcada mare sunt trei simboluri, vizibile când lumina cade din dreapta: clopot, far, ceas. DJ Covrig își amintește că îl duceau la chei să vadă proba luminilor.','Simbolurile sunt trei opriri, nu trei ore. Clopotul se aude la festival, farul luminează digul, iar ceasul din Arămia anunță ultima predare.'],
      ['The Marks Beneath the Bridge','Three symbols appear on the big arch when light comes from the right: a bell, a lighthouse and a clock. DJ Covrig remembers being taken to the quay to watch a lighting test.','The symbols mark three stops, not three times. The bell rings at the festival, the lighthouse lights the breakwater, and the clock in Arămia signals the final handover.']
    ],
    festival:[
      ['Ritm de recunoscut','Când se aud cele trei bătăi pe chei, o barcă răspunde cu felinarul. Cine o conduce are încă o fotografie de la ultima tură. Pe bord se vede coletul de la numărul 0.','Curierul din fotografie îi arată unei fete cum se aprinde farul. Fata e Geta. Omul de pe barcă a păstrat cheia, dar lentila nouă trebuie montată la Brizeni.'],
      ['A Familiar Rhythm','When three knocks sound along the quay, a boat answers with a lantern. Its skipper still has a photograph from the last run. The parcel from number zero sits on its dashboard.','The courier in the photograph is teaching a girl to light the lighthouse. It is Geta. The skipper kept the key, but the new lens needs fitting in Brizeni.']
    ],
    far:[
      ['Farul se aprinde','Doru duce busolele pe dig. Acum ai cheia și poți verifica indicația de pe colet. Când lentila intră pe locaș, toată platforma prinde o dungă de lumină.','Fasciculul arată numărul 0 pictat pe o tăbliță la dana de sud. Pe dedesubt scrie „punct de întâlnire”. Adresa nu a fost niciodată o casă.'],
      ['The Lighthouse Comes On','Doru takes the compasses across the breakwater. With the key in hand you can follow the note on the parcel. As the lens slots in, a bar of light cuts across the platform.','The beam picks out a zero on a sign at the south berth. Under it are the words “handover point.” The address was never a house.']
    ],
    dana:[
      ['Ultima barcă nu pleacă goală','La dana de sud te așteaptă o persoană de pe lista de la depou. A venit să-și ia scrisoarea. Are în buzunar copia unei chitanțe pentru coletul sigilat.','Chitanța are două semnături. Una e a Getei. Cealaltă e a mamei ei, chiar femeia care a ținut ruta deschisă când podul a căzut.'],
      ['The Last Boat Has Cargo','At the south berth, someone from the depot list is waiting for their letter. They have a copy of the receipt for the sealed parcel in their pocket.','The receipt has two signatures. One belongs to Geta. The other is her mother’s, the woman who kept the route running after the bridge came down.']
    ],
    regata:[
      ['O adresă la fiecare oprire','După probă, echipajele regatei aduc semnele recuperate de pe dig. Unele adrese de pe listă s-au schimbat, dar oamenii își amintesc cui le sunt scrise plicurile.','Mai lipsesc destinatarii de la munte. Acolo, semnalul farului era preluat de o lampă din gară. Trenul următor are loc pentru un sac.'],
      ['An Address at Every Stop','After their practice run, the regatta crews bring back signs recovered from the breakwater. Some addresses on the list have changed, but people remember who the letters were for.','The mountain recipients are still missing. Up there a station lamp used to relay the lighthouse signal. The next train has room for one bag.']
    ],
    gara_faget:[
      ['Biletul de dus','La gara de munte, conductorul găsește biletul din ultima tură pe sub geamul ghișeului. Poartă numele Getei și, la rubrica retur, doar cifra 0.','Geta nu era destinatarul coletului. Ea conducea ultima porțiune și a plecat să ia sacul de la cabană. Cineva i-a șters traseul de pe panou cât era sus.'],
      ['The Outbound Ticket','At the mountain station, the conductor finds a ticket from the last run beneath the counter glass. It bears Geta’s name and a single zero in the return box.','Geta was not the parcel’s recipient. She drove the last leg and went up to collect the bag from the cabin. Someone erased the route from the board while she was away.']
    ],
    telecabina:[
      ['Semnul din zăpadă','Telescaunul împotmolit nu mai poate duce lada mecanicului. Pe pârghia lui e prinsă o etichetă veche: „Ține traseul închis până putem aprinde toate cele trei lumini”.','Ruta a fost scoasă de pe panou ca lumea să nu intre pe pod în întuneric. S-a crezut că va fi o singură noapte. Între timp, luminile s-au stins una câte una.'],
      ['The Sign in the Snow','The stalled chairlift can no longer carry the mechanic’s crate. An old tag hangs from its lever: “Keep the route closed until we can light all three signals.”','They removed the route from the board to keep people off the bridge in the dark. They thought it would be one night. Over time, the lights went out one by one.']
    ],
    observator:[
      ['Două lumini văzute de sus','Prin telescop se văd, în aceeași linie, farul și cupola observatorului. Între cele două, într-o fotografie veche, se aprindea o a treia lumină, sub ceasul din Arămia.','Lumina veche e încă pe turn. Ultimii destinatari pot fi găsiți la parada orașului. Pe lista de la depou apar cu o singură adresă, „sub ceas”.'],
      ['Two Lights from Above','Through the telescope you can line up the lighthouse with the observatory dome. In an old photograph, a third light shone between them, beneath the clock in Arămia.','The old lamp is still on the tower. The final recipients can be found at the town parade. The depot list gives all of them one address: “under the clock.”']
    ],
    sere:[
      ['Ce așteaptă oamenii','În sere găsești plicuri de semințe cu aceleași nume ca pe listă. După inundație, oamenii își trimiteau semințe, adrese și vești ca să poată pune grădinile la loc.','Tanti Geta lasă primele plicuri la familiile care apar pe listă. Una îi dă un răsad pentru mama ei și o roagă să deschidă coletul sub ceas.'],
      ['What People Were Waiting For','In the greenhouses you find seed packets with the same names as the list. After the flood, people sent seeds, new addresses and news to help each other plant their gardens again.','Geta delivers the first letters to the families on the list. One gives her a seedling for her mother and asks her to open the parcel beneath the clock.']
    ],
    turn_cupru:[
      ['Un minut până la semnal','Mecanicul desface ceasul. În capac e prins un bilet de la mama Getei: „Dacă ajungi până aici, ultima oprire e a ta. Aprinde lumina și cheamă-i pe toți”.','Se aprinde a treia lumină. Geta îți întinde coletul cu desenul la vedere. „Mama mi l-a lăsat să-l dau mai departe când găsesc pe cineva care vrea să termine ruta.”'],
      ['One Minute to the Signal','The mechanic opens the clock. Inside the cover is a note from Geta’s mother: “If you make it this far, the final stop is yours. Turn on the light and call everyone over.”','The third light comes on. Geta hands you the parcel with the drawing facing up. “Mum left it with me to pass on when I found someone willing to finish the route.”']
    ],
    parada:[
      ['La numărul 0','Sub ceas, Geta așază răsadul lângă plicurile rămase. Mai trebuie livrate lampioanele înainte să intre parada în piață. Din toate orașele, oamenii vin să-și ridice scrisorile.','În colet găsiți o ștampilă de poștă și o hartă albă, cu șase puncte. Geta face pe ea primul semn, la numărul 0. Îți dă ție creionul. De mâine, pe panou apare din nou ruta de noapte.'],
      ['At Number Zero','Beneath the clock, Geta puts the seedling beside the remaining letters. The lanterns must reach the square before the parade arrives. People from every town are coming to collect their letters.','Inside the parcel you find a postal stamp and a blank map with six dots. Geta makes the first mark, at number zero, then hands you the pencil. Tomorrow the night route goes back on the board.']
    ]
  };
  function scene(id,language='ro'){
    const text=scenes[id]?.[language==='en'?1:0];
    return text?{title:text[0],before:text[1],after:text[2]}:null;
  }
  const api={scene};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CurierStory=api;
})(globalThis);
