// Nicknames

var Nicknames={
    "alexander":["alex"],
	"alex":["alejandro"],
    "andrew":["drew","andy"],
    "angela":["angie"],
    "andy":["andrew","drew"],
    "anthony":["tony"],
    "balakumar":["kumar"],
    "benjamin":["ben"],
    "beth":["elizabeth"],
    "bradley":["brad"],
    "bob":["robert","rob","bobby"],
    "bill":["william","will","billy"],
    "charlie":["charles","chuck"],
    "charles":["charlie","chuck"],
    "cheryl":["cherie"],
    "cherie":["cheryl"],
    "chris":["christopher"],
    "christopher":["chris"],
    "chuck":["charles","charlie"],
    "clinton":["clint"],
	"dan":["daniel","danny"],
	"danny":["dan","daniel"],
	"daniel":["dan","danny"],
    "dennis":["denny"],
    "dick":["richard","rick"],
	"dmitry":["dmitrii"],
    "douglas":["doug"],
    "doug":["douglas"],
    "drew":["andrew","andy"],
    "elizabeth":["beth"],
    "eugene":["gene"],
    "frederick":["fred","rick"],
    "gene":["eugene"],
	"hank":["henry"],
    "harold":["harry"],
	"henry":["hank"],
    "jacob":["jake"],
    "jake":["jacob"],
    "james":["jim"],
    "jeffery":["jeff"],
    "jeffrey":["jeff"],
	"jennifer":["jen","jenny"],
	"jen":["jennifer","jenny"],
	"jenny":["jennifer","jen"],
    "jim":["james"],
    "joe":["joseph"],
    "john":["jack"],
    "joseph":["joe"],
    "judith":["judy"],
    "kathleen":["kathy"],
    "katherine":["kate","katie"],
    "kathryn":["kate","katie"],
    "kimberly":["kim"],
    "kumar":["balakumar"],
    "lawrence":["larry"],
	"manny":["emanuel","manuel"],
	"manuel":["manny"],
    "martin":["marty"],
	"marty":["martin"],
    "matthew":["matt"],
	"matt":["matthew"],
    "michael":["mike"],
    "nicholas":["nick"],
	"nick":["nicholas"],
    "pam":["pamela"],
    "pamela":["pam"],
    "patricia":["trish","tricia","patty","patsy"],
    "philip":["phil"],
    "phillip":["phil"],
    "rebecca":["becca","becky"],
    "richard":["rich","rick","dick"],
	"rick":["richard","dick","rich"],
    "rob":["bob","robert","bobby"],
    "robert":["bob","rob","bobby"],
    "ronald":["ron"],
    "ron":["ronald"],
    "russell":["russ"],
    "russ":["russell"],
    "samuel":["sam"],
    "steven":["steve","stephen"],
    "steve":["steven","stephen"],
    "stephen":["steve"],
    "stuart":["stu"],
    "susan":["sue","susie"],
    "theodore":["ted"],
    "thomas":["tom"],
    "tim":["timothy"],
    "timothy":["tim"],
    "tom":["thomas"],
    "trish":["patricia"],
    "val":["valerie"],
    "valerie":["val"],
    "vince":["vincent"],
    "vincent":["vince"],
    "william":["will","bill","billy"]
};
/** Required MTurkScript.js */
function matches_person_names(desired_name,found_name,i) {
        var parsed_desired=MTurkScript.prototype.parse_name(desired_name);
        var parsed_found=MTurkScript.prototype.parse_name(found_name);
        console.log("matches_person_names, parsed_desired="+JSON.stringify(parsed_desired)+", parsed_found="+JSON.stringify(parsed_found));
        if(parsed_desired.lname.toLowerCase()!=parsed_found.lname.toLowerCase()
          && found_name.toLowerCase().indexOf(parsed_desired.lname.toLowerCase())===-1&&parsed_desired.lname.replace(/^[a-z][^\s]*\s/,"").toLowerCase()!=parsed_found.lname.toLowerCase()
          )
        {
            if(!(/[A-Z]\.$/.test(parsed_found.lname)&&parsed_found.lname.substr(0,1)===parsed_desired.lname.substr(0,1))) {
                console.log("Returning false on lname");
                return false;
            }
        }
        if(parsed_desired.fname.toLowerCase()===parsed_found.fname.toLowerCase() ||
           parsed_desired.fname.toLowerCase().indexOf(parsed_found.fname.toLowerCase())!=-1 ||
              parsed_found.fname.toLowerCase().indexOf(parsed_desired.fname.toLowerCase())!=-1 ||
           found_name.toLowerCase().indexOf(parsed_desired.fname.toLowerCase())!=-1) {
            return true;
        }
        if(parsed_found.fname.split("-")[0].toLowerCase()===parsed_desired.fname.split("-")[0].toLowerCase()) return true;
        if(Nicknames[parsed_desired.fname.toLowerCase()]!=undefined && Nicknames[parsed_desired.fname.toLowerCase()].includes(parsed_found.fname.toLowerCase())) return true;
        if(Nicknames[parsed_found.fname.toLowerCase()]!=undefined && Nicknames[parsed_found.fname.toLowerCase()].includes(parsed_desired.fname.toLowerCase())) return true;

        return false;

    }