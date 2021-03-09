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
    "dennis":["denny"],
    "dick":["richard","rick"],
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
    "martin":["marty"],
    "matthew":["matt"],
    "michael":["mike"],
    "nicholas":["nick"],
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
function matches_person_names(desired_name,found_name) {
	var parsed_desired=MTurkScript.prototype.parse_name(desired_name);
	var parsed_found=MTurkScript.prototype.parse_name(found_name);

	if(parsed_desired.lname.toLowerCase()!=parsed_found.lname.toLowerCase()) return false;
	if(parsed_desired.fname.toLowerCase()===parsed_found.fname.toLowerCase()) return true;
	if(Nicknames[parsed_desired.fname.toLowerCase()]!=undefined && Nicknames[parsed_desired.fname.toLowerCase()].includes(parsed_found.fname.toLowerCase())) return true;
	return false;

}
