/* Text can be an object or a string with address text, location currently unused */
function Address(text,priority,url,debug) {
    if(!debug) this.debug=false;
    if(this.debug) console.log("# In address for "+text);
    this.priority=priority;
    this.url=url;
    this.text=text;
    var ret;
    if(typeof(this.text)==='object' &&
       this.set_address(this.text.address1,text.address2,text.city,text.state,text.postcode,text.country)) this.priority=priority;
    else if((ret=this.parse_address(this.text.trim()))||true) this.priority=this.priority+ret;
    else this.priority=(1 << 25);
    if(this.address1 && /^[^\d]{2,}/.test(this.address1) && /[\d]+.{4,}/.test(this.address1)) {
    this.address1=this.address1.replace(/^[^\d]*/,""); }
}

Address.street_type_map={
    allee       : "aly",
    alley       : "aly",
    ally        : "aly",
    anex        : "anx",
    annex       : "anx",
    annx        : "anx",
    arcade      : "arc",
    av          : "ave",
    aven        : "ave",
    avenu       : "ave",
    avenue      : "ave",
    avn         : "ave",
    avnue       : "ave",
    bayoo       : "byu",
    bayou       : "byu",
    beach       : "bch",
    bend        : "bnd",
    bluf        : "blf",
    bluff       : "blf",
    bluffs      : "blfs",
    bot         : "btm",
    bottm       : "btm",
    bottom      : "btm",
    boul        : "blvd",
    boulevard   : "blvd",
    boulv       : "blvd",
    branch      : "br",
    brdge       : "brg",
    bridge      : "brg",
    brnch       : "br",
    brook       : "brk",
    brooks      : "brks",
    burg        : "bg",
    burgs       : "bgs",
    bypa        : "byp",
    bypas       : "byp",
    bypass      : "byp",
    byps        : "byp",
    camp        : "cp",
    canyn       : "cyn",
    canyon      : "cyn",
    cape        : "cpe",
    causeway    : "cswy",
    causway     : "cswy",
    causwa      : "cswy",
    cen         : "ctr",
    cent        : "ctr",
    center      : "ctr",
    centers     : "ctrs",
    centr       : "ctr",
    centre      : "ctr",
    circ        : "cir",
    circl       : "cir",
    circle      : "cir",
    circles     : "cirs",
    ck          : "crk",
    cliff       : "clf",
    cliffs      : "clfs",
    club        : "clb",
    cmp         : "cp",
    cnter       : "ctr",
    cntr        : "ctr",
    cnyn        : "cyn",
    common      : "cmn",
    commons     : "cmns",
    corner      : "cor",
    corners     : "cors",
    course      : "crse",
    court       : "ct",
    courts      : "cts",
    cove        : "cv",
    coves       : "cvs",
    cr          : "crk",
    crcl        : "cir",
    crcle       : "cir",
    crecent     : "cres",
    creek       : "crk",
    crescent    : "cres",
    cresent     : "cres",
    crest       : "crst",
    crossing    : "xing",
    crossroad   : "xrd",
    crossroads  : "xrds",
    crscnt      : "cres",
    crsent      : "cres",
    crsnt       : "cres",
    crssing     : "xing",
    crssng      : "xing",
    crt         : "ct",
    curve       : "curv",
    dale        : "dl",
    dam         : "dm",
    div         : "dv",
    divide      : "dv",
    driv        : "dr",
    drive       : "dr",
    drives      : "drs",
    drv         : "dr",
    dvd         : "dv",
    estate      : "est",
    estates     : "ests",
    exp         : "expy",
    expr        : "expy",
    express     : "expy",
    expressway  : "expy",
    expw        : "expy",
    extension   : "ext",
    extensions  : "exts",
    extn        : "ext",
    extnsn      : "ext",
    fall        : "fall",
    falls       : "fls",
    ferry       : "fry",
    field       : "fld",
    fields      : "flds",
    flat        : "flt",
    flats       : "flts",
    ford        : "frd",
    fords       : "frds",
    forest      : "frst",
    forests     : "frst",
    forg        : "frg",
    forge       : "frg",
    forges      : "frgs",
    fork        : "frk",
    forks       : "frks",
    fort        : "ft",
    freeway     : "fwy",
    freewy      : "fwy",
    frry        : "fry",
    frt         : "ft",
    frway       : "fwy",
    frwy        : "fwy",
    garden      : "gdn",
    gardens     : "gdns",
    gardn       : "gdn",
    gateway     : "gtwy",
    gatewy      : "gtwy",
    gatway      : "gtwy",
    glen        : "gln",
    glens       : "glns",
    grden       : "gdn",
    grdn        : "gdn",
    grdns       : "gdns",
    green       : "grn",
    greens      : "grns",
    grov        : "grv",
    grove       : "grv",
    groves      : "grvs",
    gtway       : "gtwy",
    harb        : "hbr",
    harbor      : "hbr",
    harbors     : "hbrs",
    harbr       : "hbr",
    haven       : "hvn",
    havn        : "hvn",
    height      : "hts",
    heights     : "hts",
    hgts        : "hts",
    highway     : "hwy",
    highwy      : "hwy",
    hill        : "hl",
    hills       : "hls",
    hiway       : "hwy",
    hiwy        : "hwy",
    hllw        : "holw",
    hollow      : "holw",
    hollows     : "holw",
    holws       : "holw",
    hrbor       : "hbr",
    ht          : "hts",
    hway        : "hwy",
    inlet       : "inlt",
    island      : "is",
    islands     : "iss",
    isles       : "isle",
    islnd       : "is",
    islnds      : "iss",
    jction      : "jct",
    jctn        : "jct",
    jctns       : "jcts",
    junction    : "jct",
    junctions   : "jcts",
    junctn      : "jct",
    juncton     : "jct",
    key         : "ky",
    keys        : "kys",
    knol        : "knl",
    knoll       : "knl",
    knolls      : "knls",
    la          : "ln",
    lake        : "lk",
    lakes       : "lks",
    land        : "land",
    landing     : "lndg",
    lane        : "ln",
    lanes       : "ln",
    ldge        : "ldg",
    light       : "lgt",
    lights      : "lgts",
    lndng       : "lndg",
    loaf        : "lf",
    lock        : "lck",
    locks       : "lcks",
    lodg        : "ldg",
    lodge       : "ldg",
    loops       : "loop",
    mall        : "mall",
    manor       : "mnr",
    manors      : "mnrs",
    meadow      : "mdw",
    meadows     : "mdws",
    medows      : "mdws",
    mews        : "mews",
    mill        : "ml",
    mills       : "mls",
    mission     : "msn",
    missn       : "msn",
    mnt         : "mt",
    mntain      : "mtn",
    mntn        : "mtn",
    mntns       : "mtns",
    motorway    : "mtwy",
    mount       : "mt",
    mountain    : "mtn",
    mountains   : "mtns",
    mountin     : "mtn",
    mssn        : "msn",
    mtin        : "mtn",
    neck        : "nck",
    orchard     : "orch",
    orchrd      : "orch",
    overpass    : "opas",
    ovl         : "oval",
    parks       : "park",
    parkway     : "pkwy",
    parkways    : "pkwy",
    parkwy      : "pkwy",
    pass        : "pass",
    passage     : "psge",
    paths       : "path",
    pikes       : "pike",
    pine        : "pne",
    pines       : "pnes",
    pk          : "park",
    pkway       : "pkwy",
    pkwys       : "pkwy",
    pky         : "pkwy",
    place       : "pl",
    plain       : "pln",
    plaines     : "plns",
    plains      : "plns",
    plaza       : "plz",
    plza        : "plz",
    point       : "pt",
    points      : "pts",
    port        : "prt",
    ports       : "prts",
    prairie     : "pr",
    prarie      : "pr",
    prk         : "park",
    prr         : "pr",
    rad         : "radl",
    radial      : "radl",
    radiel      : "radl",
    ranch       : "rnch",
    ranches     : "rnch",
    rapid       : "rpd",
    rapids      : "rpds",
    rdge        : "rdg",
    rest        : "rst",
    ridge       : "rdg",
    ridges      : "rdgs",
    river       : "riv",
    rivr        : "riv",
    rnchs       : "rnch",
    road        : "rd",
    roads       : "rds",
    route       : "rte",
    rvr         : "riv",
    row         : "row",
    rue         : "rue",
    run         : "run",
    shoal       : "shl",
    shoals      : "shls",
    shoar       : "shr",
    shoars      : "shrs",
    shore       : "shr",
    shores      : "shrs",
    skyway      : "skwy",
    spng        : "spg",
    spngs       : "spgs",
    spring      : "spg",
    springs     : "spgs",
    sprng       : "spg",
    sprngs      : "spgs",
    spurs       : "spur",
    sqr         : "sq",
    sqre        : "sq",
    sqrs        : "sqs",
    squ         : "sq",
    square      : "sq",
    squares     : "sqs",
    station     : "sta",
    statn       : "sta",
    stn         : "sta",
    str         : "st",
    strav       : "stra",
    strave      : "stra",
    straven     : "stra",
    stravenue   : "stra",
    stravn      : "stra",
    stream      : "strm",
    street      : "st",
    streets     : "sts",
    streme      : "strm",
    strt        : "st",
    strvn       : "stra",
    strvnue     : "stra",
    sumit       : "smt",
    sumitt      : "smt",
    summit      : "smt",
    terr        : "ter",
    terrace     : "ter",
    throughway  : "trwy",
    tpk         : "tpke",
    tr          : "trl",
    trace       : "trce",
    traces      : "trce",
    track       : "trak",
    tracks      : "trak",
    trafficway  : "trfy",
    trail       : "trl",
    trails      : "trl",
    trk         : "trak",
    trks        : "trak",
    trls        : "trl",
    trnpk       : "tpke",
    trpk        : "tpke",
    tunel       : "tunl",
    tunls       : "tunl",
    tunnel      : "tunl",
    tunnels     : "tunl",
    tunnl       : "tunl",
    turnpike    : "tpke",
    turnpk      : "tpke",
    underpass   : "upas",
    union       : "un",
    unions      : "uns",
    valley      : "vly",
    valleys     : "vlys",
    vally       : "vly",
    vdct        : "via",
    viadct      : "via",
    viaduct     : "via",
    view        : "vw",
    views       : "vws",
    vill        : "vlg",
    villag      : "vlg",
    village     : "vlg",
    villages    : "vlgs",
    ville       : "vl",
    villg       : "vlg",
    villiage    : "vlg",
    vist        : "vis",
    vista       : "vis",
    vlly        : "vly",
    vst         : "vis",
    vsta        : "vis",
    wall        : "wall",
    walks       : "walk",
    well        : "wl",
    wells       : "wls",
    wy          : "way",
  };


Address.country_list=[
{"name": "Afghanistan", "code": "AF"},{"name": "Åland Islands", "code": "AX"},{"name": "Albania", "code": "AL"},
{"name": "Algeria", "code": "DZ"},{"name": "American Samoa", "code": "AS"},{"name": "AndorrA", "code": "AD"},
{"name": "Angola", "code": "AO"},{"name": "Anguilla", "code": "AI"},{"name": "Antarctica", "code": "AQ"},
{"name": "Antigua and Barbuda", "code": "AG"},{"name": "Argentina", "code": "AR"},{"name": "Armenia", "code": "AM"},
{"name": "Aruba", "code": "AW"},{"name": "Australia", "code": "AU"},{"name": "Austria", "code": "AT"},
{"name": "Azerbaijan", "code": "AZ"},{"name": "Bahamas", "code": "BS"},{"name": "Bahrain", "code": "BH"},
{"name": "Bangladesh", "code": "BD"},{"name": "Barbados", "code": "BB"},{"name": "Belarus", "code": "BY"},
{"name": "Belgium", "code": "BE"},{"name": "Belize", "code": "BZ"},{"name": "Benin", "code": "BJ"},
{"name": "Bermuda", "code": "BM"},{"name": "Bhutan", "code": "BT"},{"name": "Bolivia", "code": "BO"},
{"name": "Bosnia and Herzegovina", "code": "BA"},{"name": "Botswana", "code": "BW"},{"name": "Bouvet Island", "code": "BV"},
{"name": "Brazil", "code": "BR"},{"name": "British Indian Ocean Territory", "code": "IO"},{"name": "Brunei Darussalam", "code": "BN"},
{"name": "Bulgaria", "code": "BG"},
{"name": "Burkina Faso", "code": "BF"},
{"name": "Burundi", "code": "BI"},
{"name": "Cambodia", "code": "KH"},
{"name": "Cameroon", "code": "CM"},
{"name": "Canada", "code": "CA"},
{"name": "Cape Verde", "code": "CV"},
{"name": "Cayman Islands", "code": "KY"},
{"name": "Central African Republic", "code": "CF"},
{"name": "Chad", "code": "TD"},
{"name": "Chile", "code": "CL"},
{"name": "China", "code": "CN"},
{"name": "Christmas Island", "code": "CX"},
{"name": "Cocos (Keeling) Islands", "code": "CC"},
{"name": "Colombia", "code": "CO"},
{"name": "Comoros", "code": "KM"},
{"name": "Congo", "code": "CG"},
{"name": "Congo, The Democratic Republic of the", "code": "CD"},
{"name": "Cook Islands", "code": "CK"},
{"name": "Costa Rica", "code": "CR"},
{"name": "Cote D\'Ivoire", "code": "CI"},
{"name": "Croatia", "code": "HR"},
{"name": "Cuba", "code": "CU"},
{"name": "Cyprus", "code": "CY"},
{"name": "Czech Republic", "code": "CZ"},
{"name": "Denmark", "code": "DK"},
{"name": "Djibouti", "code": "DJ"},
{"name": "Dominica", "code": "DM"},
{"name": "Dominican Republic", "code": "DO"},
{"name": "Ecuador", "code": "EC"},
{"name": "Egypt", "code": "EG"},
{"name": "El Salvador", "code": "SV"},
{"name": "Equatorial Guinea", "code": "GQ"},
{"name": "Eritrea", "code": "ER"},
{"name": "Estonia", "code": "EE"},
{"name": "Ethiopia", "code": "ET"},
{"name": "Falkland Islands (Malvinas)", "code": "FK"},
{"name": "Faroe Islands", "code": "FO"},
{"name": "Fiji", "code": "FJ"},
{"name": "Finland", "code": "FI"},
{"name": "France", "code": "FR"},
{"name": "French Guiana", "code": "GF"},
{"name": "French Polynesia", "code": "PF"},
{"name": "French Southern Territories", "code": "TF"},
{"name": "Gabon", "code": "GA"},
{"name": "Gambia", "code": "GM"},
{"name": "Georgia", "code": "GE"},
{"name": "Germany", "code": "DE"},
{"name": "Ghana", "code": "GH"},
{"name": "Gibraltar", "code": "GI"},
{"name": "Greece", "code": "GR"},
{"name": "Greenland", "code": "GL"},
{"name": "Grenada", "code": "GD"},
{"name": "Guadeloupe", "code": "GP"},
{"name": "Guam", "code": "GU"},
{"name": "Guatemala", "code": "GT"},
{"name": "Guernsey", "code": "GG"},
{"name": "Guinea", "code": "GN"},
{"name": "Guinea-Bissau", "code": "GW"},
{"name": "Guyana", "code": "GY"},
{"name": "Haiti", "code": "HT"},
{"name": "Heard Island and Mcdonald Islands", "code": "HM"},
{"name": "Holy See (Vatican City State)", "code": "VA"},
{"name": "Honduras", "code": "HN"},
{"name": "Hong Kong", "code": "HK"},
{"name": "Hungary", "code": "HU"},
{"name": "Iceland", "code": "IS"},
{"name": "India", "code": "IN"},
{"name": "Indonesia", "code": "ID"},
{"name": "Iran, Islamic Republic Of", "code": "IR"},
{"name": "Iraq", "code": "IQ"},
{"name": "Ireland", "code": "IE"},
{"name": "Isle of Man", "code": "IM"},
{"name": "Israel", "code": "IL"},
{"name": "Italy", "code": "IT"},
{"name": "Jamaica", "code": "JM"},
{"name": "Japan", "code": "JP"},
{"name": "Jersey", "code": "JE"},
{"name": "Jordan", "code": "JO"},
{"name": "Kazakhstan", "code": "KZ"},
{"name": "Kenya", "code": "KE"},
{"name": "Kiribati", "code": "KI"},
{"name": "Korea, Democratic People\'s Republic of", "code": "KP"},
{"name": "Korea, Republic of", "code": "KR"},
{"name": "Kuwait", "code": "KW"},
{"name": "Kyrgyzstan", "code": "KG"},
{"name": "Lao People\'s Democratic Republic", "code": "LA"},
{"name": "Latvia", "code": "LV"},
{"name": "Lebanon", "code": "LB"},
{"name": "Lesotho", "code": "LS"},
{"name": "Liberia", "code": "LR"},
{"name": "Libyan Arab Jamahiriya", "code": "LY"},
{"name": "Liechtenstein", "code": "LI"},
{"name": "Lithuania", "code": "LT"},
{"name": "Luxembourg", "code": "LU"},
{"name": "Macao", "code": "MO"},
{"name": "Macedonia, The Former Yugoslav Republic of", "code": "MK"},
{"name": "Madagascar", "code": "MG"},
{"name": "Malawi", "code": "MW"},
{"name": "Malaysia", "code": "MY"},
{"name": "Maldives", "code": "MV"},
{"name": "Mali", "code": "ML"},
{"name": "Malta", "code": "MT"},
{"name": "Marshall Islands", "code": "MH"},
{"name": "Martinique", "code": "MQ"},
{"name": "Mauritania", "code": "MR"},
{"name": "Mauritius", "code": "MU"},
{"name": "Mayotte", "code": "YT"},
{"name": "Mexico", "code": "MX"},
{"name": "Micronesia, Federated States of", "code": "FM"},
{"name": "Moldova, Republic of", "code": "MD"},
{"name": "Monaco", "code": "MC"},
{"name": "Mongolia", "code": "MN"},
{"name": "Montserrat", "code": "MS"},
{"name": "Morocco", "code": "MA"},
{"name": "Mozambique", "code": "MZ"},
{"name": "Myanmar", "code": "MM"},
{"name": "Namibia", "code": "NA"},
{"name": "Nauru", "code": "NR"},
{"name": "Nepal", "code": "NP"},
{"name": "Netherlands", "code": "NL"},
{"name": "Netherlands Antilles", "code": "AN"},
{"name": "New Caledonia", "code": "NC"},
{"name": "New Zealand", "code": "NZ"},
{"name": "Nicaragua", "code": "NI"},
{"name": "Niger", "code": "NE"},
{"name": "Nigeria", "code": "NG"},
{"name": "Niue", "code": "NU"},
{"name": "Norfolk Island", "code": "NF"},
{"name": "Northern Mariana Islands", "code": "MP"},
{"name": "Norway", "code": "NO"},
{"name": "Oman", "code": "OM"},
{"name": "Pakistan", "code": "PK"},
{"name": "Palau", "code": "PW"},
{"name": "Palestinian Territory, Occupied", "code": "PS"},
{"name": "Panama", "code": "PA"},
{"name": "Papua New Guinea", "code": "PG"},
{"name": "Paraguay", "code": "PY"},
{"name": "Peru", "code": "PE"},
{"name": "Philippines", "code": "PH"},
{"name": "Pitcairn", "code": "PN"},
{"name": "Poland", "code": "PL"},
{"name": "Portugal", "code": "PT"},
{"name": "Puerto Rico", "code": "PR"},
{"name": "Qatar", "code": "QA"},
{"name": "Reunion", "code": "RE"},
{"name": "Romania", "code": "RO"},
{"name": "Russian Federation", "code": "RU"},
{"name": "RWANDA", "code": "RW"},
{"name": "Saint Helena", "code": "SH"},
{"name": "Saint Kitts and Nevis", "code": "KN"},
{"name": "Saint Lucia", "code": "LC"},
{"name": "Saint Pierre and Miquelon", "code": "PM"},
{"name": "Saint Vincent and the Grenadines", "code": "VC"},
{"name": "Samoa", "code": "WS"},
{"name": "San Marino", "code": "SM"},
{"name": "Sao Tome and Principe", "code": "ST"},
{"name": "Saudi Arabia", "code": "SA"},
{"name": "Senegal", "code": "SN"},
{"name": "Serbia and Montenegro", "code": "CS"},
{"name": "Seychelles", "code": "SC"},
{"name": "Sierra Leone", "code": "SL"},
{"name": "Singapore", "code": "SG"},
{"name": "Slovakia", "code": "SK"},
{"name": "Slovenia", "code": "SI"},
{"name": "Solomon Islands", "code": "SB"},
{"name": "Somalia", "code": "SO"},
{"name": "South Africa", "code": "ZA"},
{"name": "South Georgia and the South Sandwich Islands", "code": "GS"},
{"name": "Spain", "code": "ES"},
{"name": "Sri Lanka", "code": "LK"},
{"name": "Sudan", "code": "SD"},{"name": "Suriname", "code": "SR"},
{"name": "Svalbard and Jan Mayen", "code": "SJ"},{"name": "Swaziland", "code": "SZ"},{"name": "Sweden", "code": "SE"},{"name": "Switzerland", "code": "CH"},{"name": "Syrian Arab Republic", "code": "SY"},{"name": "Taiwan, Province of China", "code": "TW"},{"name": "Tajikistan", "code": "TJ"},{"name": "Tanzania, United Republic of", "code": "TZ"},{"name": "Thailand", "code": "TH"},{"name": "Timor-Leste", "code": "TL"},{"name": "Togo", "code": "TG"},{"name": "Tokelau", "code": "TK"},{"name": "Tonga", "code": "TO"},{"name": "Trinidad and Tobago", "code": "TT"},{"name": "Tunisia", "code": "TN"},{"name": "Turkey", "code": "TR"},{"name": "Turkmenistan", "code": "TM"},{"name": "Turks and Caicos Islands", "code": "TC"},{"name": "Tuvalu", "code": "TV"},{"name": "Uganda", "code": "UG"},{"name": "Ukraine", "code": "UA"},{"name": "United Arab Emirates", "code": "AE"},{"name": "United Kingdom", "code": "GB"},{"name": "United States", "code": "US"},{"name": "United States Minor Outlying Islands", "code": "UM"},
{"name": "Uruguay", "code": "UY"},{"name": "Uzbekistan", "code": "UZ"},{"name": "Vanuatu", "code": "VU"},
{"name": "Venezuela", "code": "VE"},{"name": "Viet Nam", "code": "VN"},{"name": "Virgin Islands, British", "code": "VG"},
{"name": "Virgin Islands, U.S.", "code": "VI"},{"name": "Wallis and Futuna", "code": "WF"},{"name": "Western Sahara", "code": "EH"},
{"name": "Yemen", "code": "YE"},{"name": "Zambia", "code": "ZM"},{"name": "Zimbabwe", "code": "ZW"}
];

Address.prototype.parse_address=function(text) {
    this.text=this.text.replace(/\|/g,",");
    this.fix_nonewlinestreets();
    if(this.parse_address_US(text)) return 1;
    if(this.parse_address_Canada(text)) return 1;
    if(/[^A-Za-z]Sweden$/.test(text) && this.parse_address_Sweden(text)) return 1;
    if(/[^A-Za-z](UK|United Kingdom)$/.test(text) && this.parse_address_UK(text)) return 1;
    if(/[^A-Za-z](Belgium)$/.test(text) && this.parse_address_Belgium(text)) return 1;
    if(this.parse_address_Europe(text)) {
    return 2; }
    return 1<<25;
};

Address.prototype.fix_nonewlinestreets=function() {
    var x,temp_re;
    for(x in Address.street_type_map) {
        x=x[0].toUpperCase()+x.slice(1);
        temp_re=new RegExp('('+x+')([A-Z])');
        this.text=this.text.replace(temp_re,"$1,$2");
    }
};


// Set the address of something directly */
Address.prototype.set_address=function(address1,address2,city,state,postcode,country) {
    if(address1) this.address1=address1.trim();
    if(address2) this.address2=address2.trim();
    if(city) this.city=city.trim();
    if(state) this.state=state.trim();
    if(postcode) this.postcode=postcode.trim();
    if(country) this.country=country.trim();
    return true;
};

Address.sanitize_text_US=function(text) {
    text=text.replace(/\n/g,",");
    var fl_regex=/(?:,\s*)?([\d]+(th|rd|nd|st) Fl(?:(?:oo)?r)?)\s*([,\s])/i,match;
    var ann_regex=/(?:,\s*)(Annex [^,]*),/i;
    var floor=text.match(fl_regex),annex=text.match(ann_regex);
    var after_dash_regex=/^([^,]*?)\s+-\s+([^,]*)/;
    var after_dash=text.match(after_dash_regex),second_part;
    text=text.replace(after_dash_regex,"$1").trim();
	text=text.replace(/^[A-Za-z\s]+:\s*/,"").trim();
	text=text.replace(/(Box \d)([A-Z])/,"$1, $2").trim();
    text=text.replace(fl_regex,"$3").trim();
    text=text.replace(/,\s*(US|United States|United States of America|USA)$/i,"");
    // replace PO DRAWER //
    text=text.replace(/(^|,)(\s*)(?:P\.?O\.?\s*)?(DRAWER|BOX)(\s)/i,"$1$2PO Box$4");
    text=text.replace(ann_regex,",").trim();
    text=text.replace(/([a-bd-z0-9])([A-Z][a-z]+)/,"$1,$2");
    //console.log("Before fix, text="+text);
    var parsed=parseAddress.parseLocation(text);
    var add2_extra=(floor?floor[1]:"");
    if(!(parsed&&parsed.city&&parsed.zip) && /^[A-Za-z]/.test(text)) {
    //console.log("Replacing A-Z beginning");
    text=text.replace(/^[^,]*,/,"").trim();
    }
    if(!((parsed=parseAddress.parseLocation(text))&&parsed.city&&parsed.zip)
       && /^[0-9]/.test(text)) {
        second_part=text.match(/^([^,]*),([^,]*),/);
        text=text.replace(/^([^,]*),([^,]*),/,"$1,");
    }
    add2_extra=add2_extra+(add2_extra.length>0&&second_part?",":"")+(second_part?second_part[2]:"");
    add2_extra=add2_extra+(add2_extra.length>0&&annex?",":"")+(annex?annex[1]:"");
    add2_extra=add2_extra+(add2_extra.length>0&&after_dash?",":"")+(after_dash?after_dash[2]:"");
    return {text:text,add2_extra:add2_extra};
};

Address.prototype.parse_address_US=function(text) {
    
    var ret=Address.sanitize_text_US(text);
    //console.log("after removal text=("+ret.text+")");
    var parsed=parseAddress.parseLocation(ret.text);
    //console.log("parsed="+JSON.stringify(parsed));
    if(parsed&&parsed.city&&parsed.zip) {
        this.address1=((parsed.number?parsed.number+" ":"")+(parsed.prefix?parsed.prefix+" ":"")+
      (parsed.street?parsed.street+" ":"")+(parsed.type?parsed.type+" ":"")+(parsed.suffix?parsed.suffix+" ":"")).trim();
        this.address2="";
        this.address2=((parsed.sec_unit_type?parsed.sec_unit_type+" ":"")+
      (parsed.sec_unit_num?parsed.sec_unit_num+" ":"")).trim();
        if(!this.address2 || this.address2==="undefined") this.address2="";
        if(ret.add2_extra) this.address2=this.address2.trim()+(this.address2.length>0?", ":"")+ret.add2_extra;
        if(!this.address2 || this.address2==="undefined") this.address2="";
        this.city=parsed.city?parsed.city:"";
        this.state=parsed.state?parsed.state:"";
        this.postcode=parsed.zip?parsed.zip:"";
        this.country="United States";
        return true;
    }
    return false;
};
Address.prototype.parse_address_Canada=function(text) {
    var match;
    if(match=text.match(/([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/)) {
        this.postcode=match[0];
        text=text.replace(/,?\s*([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/,"");
        if(match=text.match(/(?:,|\s)\s*([A-Z]+)\s*$/)) {

            this.state=match[1];
            text=text.replace(/(,|\s)\s*([A-Z]+)\s*$/,"");
        }
        if(match=text.match(/^(.*),\s*([^,]*)$/)) {
            this.address1=match[1];
            this.city=match[2];
        }
        this.country="Canada";
        return true;
    }
    return false;
};
Address.prototype.parse_address_Europe=function(text) {
    var split=text.split(/\s*,\s*/),postcode,match;
    var regex1=/^([^,]+),\s*((?:[A-Z]\s*-\s*)?[\d]{4,})\s+([^,]+),\s*([^,]+)$/;
    var regex2=/^([^,]+),\s*\s+([^,]+),\s*((?:[A-Z]+-)?[\d]+),\s*([^,]+)$/;
    var regex3=/^([^,]+),([^,]+),\s*((?:[A-Z]+-)?[\d]+)\s*,\s*([^,]+)$/;
    var regex4=/^([^,]+),\s*((?:[A-Z]\s*-\s*)?[\d]{4,})\s+([^,]+)$/;

    if((match=text.match(regex1)) && this.set_address(match[1],"",match[3],"",match[2],match[4])) return true;
    if((match=text.match(regex2)) && this.set_address(match[1],"",match[2],"",match[3],match[4])) return true;
    if((match=text.match(regex3)) && this.set_address(match[1],"",match[2],"",match[3],match[4])) return true;
    if((match=text.match(regex4)) && this.set_address(match[1],"",match[3],"",match[2],"")) return true;

    if(this.debug) console.log("parse_address_Europe,"+text);
    return false;
};
Address.prototype.parse_address_Belgium=function(text) {
    var split=text.split(/\s*,\s*/),postcode,match;
    var regex1=/^([^,]+),\s*((?:B-)?[\d]{4})\s+([^,]+),\s*Belgium$/;
    var regex2=/^([^,]+),\s*\s+([^,]+),\s*((?:B-)?[\d]{4}),\s*Belgium$/;
    if((match=text.match(regex1)) && this.set_address(match[1],"",match[3],"",match[2],"Belgium")) return true;
    if((match=text.match(regex2)) && this.set_address(match[1],"",match[2],"",match[3],"Belgium")) return true;
    return false;
};
Address.prototype.parse_address_UK=function(text) {
    var split=text.split(/\s*,\s*/),postcode,match;
    //console.log("UK: split="+JSON.stringify(split));
    if(split.length===3&&(match=split[1].match(/[A-Z0-9\s]{3,}/))) {
        this.address1=split[0].trim();
        this.address2="";
        this.postcode=match[0].trim();
        this.state="";
        this.city=split[1].replace(/[A-Z0-9\s]{3,}/,"").trim();
        this.country="United Kingdom";
        return true;
    }
    return false;
};
Address.prototype.parse_address_Sweden=function(text) {
    var split=text.split(/\s*,\s*/),postcode,match;
    //console.log("Sweden: split="+JSON.stringify(split));
    if(split.length===3&&(match=split[1].match(/(?:SE-)?([\d\s]+)/))) {
        this.address1=split[0].trim();
        this.address2="";
        this.postcode=match[0].trim();
        this.state="";

        this.city=split[1].replace(/(?:SE-)?([\d\s]+)/,"").trim();
        this.country="Sweden";
        return true;
    }
    return false;
};
Address.cmp=function(add1,add2) {
    if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
    if(add1.priority<add2.priority) return -1;
    else if(add1.priority>add2.priority) return 1;
	
    else return 0;
};
Address.phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}(\s*x\s*[\d]{1,3})?/i;

Address.debug=false;
Address.queryList=[];
Address.addressList=[];
Address.phoneList=[];
Address.addressStrList=[];
Address.parse_postal_elem=function(elem,priority,site,url) {
    var ret={},text;
    var term_map={"streetaddress":"address1","addressLocality":"city","addressRegion":"state","postalCode":"zip","addressCountry":"country"};
    var curr_item,x;
    for(x in term_map) {
        //console.log("term_map["+x+"]="+term_map[x]+"[itemprop='"+x+"'] i");
        if(curr_item=elem.querySelector("[itemprop='"+x+"' i]")) {
            //console.log("curr_item.innerText.trim()="+curr_item.innerText.trim());
            ret[term_map[x]]=curr_item.innerText.trim().replace(/\n/g,",").trim(); }
    }
    if(/,/.test(ret.address1)) {
        ret.address2=ret.address1.replace(/^[^,]+,/,"");
        ret.address1=ret.address1.replace(/,.*$/,"");
    }
    if(ret.address1&&ret.city&&ret.state&&ret.zip) {
        //text=ret.address1+","+ret.city+", "+ret.state+" "+ret.zip;
        //console.log("* Adding address in parse_postal_elem for "+site+", text");
        Address.addressList.push(new Address(ret,priority,url,Address.debug));
    }
    
};
/* Extra has some kinda of type field and a depth field indicating the depth */
Address.scrape_address=function(doc,url,resolve,reject,extra) {
    var type=extra.type,depth=extra.depth,links=doc.links,i,promise_list=[];
    Address.debug=extra.debug;
    var contact_regex=/(Contact|Location|Privacy|Kontakt|About)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
    // if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
    //console.log("In scrape_address for type="+type+", url="+url);
    if(depth===0) {
        for(i=0; i < links.length; i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
            if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
               && !bad_contact_regex.test(links[i].href) &&
               !Address.queryList.includes(links[i].href) && Address.queryList.length<10) {
                Address.queryList.push(links[i].href);
                if(Address.debug) console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                promise_list.push(MTP.create_promise(links[i].href,Address.scrape_address_page,function(result) {
                    console.log("! Finished parsing ") },MTP.my_catch_func,type));
                continue;
            }
        }
    }
    // scrape this page
    promise_list.push(new Promise((resolve1,reject1) => {
        Address.scrape_address_page(doc,url,resolve1,reject1,type);
    }).then(MTP.my_then_func).catch(MTP.my_catch_func));
    Promise.all(promise_list).then(function(result) {
        resolve(""); })
        .catch(function(result) { if(Address.debug) console.log("Done all promises in scrape_address for "+type);
                if(Address.debug) console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
                  resolve(""); });
};

Address.scrape_address_page=function(doc,url,resolve,reject,type) {
    
    var posts=doc.querySelectorAll("[itemtype='https://schema.org/PostalAddress']");
    posts.forEach(function(elem) { Address.parse_postal_elem(elem,1,type,url); });
    var divs=doc.querySelectorAll("div,p,span,td"),i;
    for(i=0;i<divs.length;i++) Address.scrape_address_elem(doc,divs[i],type,url);
    resolve("");
};
Address.find_phones=function(doc,div,type) {
    var tel=div.querySelectorAll("a[href^='tel'");
    var phoneMatch=div.innerText.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}(\s*x\s*[\d]{1,3})?/ig);
    var i,match;
    if(tel&&tel.length>0) {
    for(i=0;i<tel.length;i++) {
        if((match=tel[i].innerText.match(Address.phone_re))) {
        Address.phoneList.push({phone:match[0].trim(),priority:2});
      }
    }
    }
    if(phoneMatch&&phoneMatch.length>0) {
    for(i=1;i<phoneMatch.length;i++) Address.phoneList.push({phone:phoneMatch[i].trim(),priority:1});
    }
};
Address.scrape_address_elem=function(doc,div,type,url) {
    var scripts=div.querySelectorAll("script,style"),i;
    var heads=doc.querySelectorAll("h1,h2,h3,h4,h5");
    for(i=0;i<heads.length;i++) heads[i].innerHTML="";
    var div_text;
     var nodelist=div.childNodes,curr_node;
    div_text="";

    for(i=0;i<nodelist.length;i++) {
    curr_node=nodelist[i];
    if(curr_node.nodeType===Node.TEXT_NODE) div_text=div_text+"\n"+curr_node.textContent.trim();
    else if(curr_node.nodeType===Node.ELEMENT_NODE&&curr_node.innerText) div_text=div_text+"\n"+curr_node.innerText.trim();
    }
    div_text=div_text.trim().replace(/\n\n+/g,"\n").replace(/(\s)\s+/g,"$1");
    var add_regex1=/Address: (.*)$/,match,add_elem=div.querySelector("address"),text,jsonstuff;
   
    for(i=0;i<scripts.length;i++) scripts[i].innerHTML="";
    Address.find_phones(doc,div,type);
    // console.log("Done removing scripts");
    if(div_text.length>1000) return;
//    console.log("Begin scrape_address_elem on "+div_text);
    try {
        if(div.tagName==="DIV" && /sqs-block-map/.test(div.className) && (jsonstuff=JSON.parse(div.dataset.blockJson))) {
            Address.addressList.push(new Address(jsonstuff.location.addressLine1+","+jsonstuff.location.addressLine2,0,url,Address.debug));
        }
    }
    catch(error) { console.log("Error parsing jsonstuff"); }
    //    console.log("Past block map");
    if(((match=div_text.match(add_regex1))&&(text=match[1])) || (add_elem && (text=Address.fix_address_text(add_elem.innerText))) ||
       (text=Address.fix_address_text_full(doc,div_text))
      )  {
//        console.log("scrape_elem, text="+text);
        text=text.replace(/\n([\t\s\n])+/g,"\n").replace(/,\s*USA/,"").replace(/\n/g,",").replace(/,[\s,]*/g,",");
        //console.log("scrape_elem, text="+text);
        let parsed;
        // console.log("add_regex1, div="+div.innerText);
        if(!Address.addressStrList.includes(text)) {
            text=text.replace(/,[\s,]*/g,",");
            var address=new Address(text,1,url,Address.debug);
            if(address.city==="") {
                //console.log("temp_text="+temp_text);
                let temp_text=text;
                while(address.city==="" && temp_text.match(/^[^,]*,\s*/)) {
                    temp_text=temp_text.replace(/^[^,]*,\s*/,"");
                    address=new Address(temp_text,1,url,Address.debug);
                }
            }
            if(address.city==="") {
                var split=address.split(/\s*|\s*/);
                for(i=0;i<split.length;i++) if((address=new Address(split[i],2,url,Address.debug)) && address.city.length>0) break;
            }
            Address.addressList.push(address);
            Address.addressStrList.push(text);
        }
    }
}
Address.fix_address_text_full=function(doc,div_text) {
    var text="";
    if(div_text.trim().length===0) return null;
    text=div_text.match(/(.{1,100}\n+)?(.*(Suite|Ste).*\n+)?.*,\s*[A-Za-z\s]+(,)?\s+[\d\-]+/i);
    if(text) text[0]=text[0].replace(/^.*Address:[\s,]*/i,"");
    if(text) return text[0].replace(/\n/g,",");
    return null; }
Address.fix_address_text=function(text) {
    text=text.replace(/^\n/g,"").replace(/\n$/g,"");
    while(text.length>0 && !/^\s*(one|two|three|four|five|six|seven|eight|nine|[\d]+)([^a-zA-Z0-9]+)/.test(text)) {
        let old_text=text;
        text=text.replace(/^[^\n]+\n/,"");
        if(old_text===text) break;
    }
    text=text.replace(/^.*Address:[\s,]*/i,"");
    return text.trim();
};
Address.paste_address=function(e,obj,field_map,callback) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
    console.log("address text="+text);
    var add=new Address(text,-50,"",Address.debug),x;
    for(x in field_map) if(add[x]!==undefined) obj[field_map[x]]=add[x];
    if(callback!==undefined && typeof(callback)==='function') callback();    
};

//if(typeof require===undefined) require=function(x) { };
/*
if(typeof module !==undefined&&typeof exports !=='undefined') {
      var parseAddress=require('parse-address');

    exports.Address=Address;
}*/
