/* LinkQual ranks link quality */
function LinkQual(href,innerText) {
    this.href=href;
    this.innerText=innerText;
    this.quality=0;
    if(/(Staff|Employee) Directory/.test(innerText)) this.quality=4;
    else if(/Directory/.test(innerText)) this.quality=3;
    else if(/Staff/.test(innerText)) this.quality=2;
}

/** 
 * Class for parsing schools
 *
 * TODO: add ability to follow link in a clear directory page as email is sometimes listed
 * on individual page
 *
 */
function School(query,then_func,catch_func) {
    var x;
    this.contact_list=[];
    this.bad_urls=[".har.com",".yelp.ca",".whereorg.com",".movoto.com",
	".adventistdirectory.org","/alumnius.net",".areavibes.com",".biz/",".buzzfile.com",".chamberofcommerce.com",".city-data.com",".donorschoose.org",".dreambox.com",".edmodo.com",
                   ".educationbug.org",".elementaryschools.org",".estately.com",".facebook.com",".greatschools.org","//high-schools.com",
                   ".hometownlocator.com",".localschooldirectory.com",".maxpreps.com",".mapquest.com",".myatlantaareahome.com",".niche.com",
                   ".nonprofitfacts.com",".pinterest.com",".prekschools.org",".neighborhoodscout.com",
                   "/publicschoolsk12.com",".publicschoolreview.com","privateschoolreview.com",".ratemyteachers.com",".realtor.com",
                   ".schoolbug.org",".schoolfamily.com",".schooldigger.com","//twitter.com",".youtube.com",
                   ".teacherlists.com",".trueschools.com",".trulia.com",".usnews.com","raise.me",
                   ".wagenersc.com",".wikipedia.org",".wikispaces.com",".wyzant.com",
                   ".yellowbook.com",".yellowpages.com",".yelp.com",".zillow.com",".usa.com","cde.ca.gov",".bigteams.com",".britannica.com"];
    this.query=query;
    this.name="";this.city="";this.state="";
    this.base="";
	var temp_self=this;
    this.resolve=function() {
		temp_self.consolidate_contacts(temp_self);
		then_func();
	};
    this.reject=catch_func ? catch_func : MTP.my_catch_func;
    this.apptegy={parser:this.parse_apptegy,suffix:"/staff",find_base:this.find_base_apptegy};
    this.blackboard={parser:this.parse_blackboard,find_directory:this.find_dir_bb,href_rx:/.*/i,
                     text_rx:/(Campus Directory)|(^Directory)|((Staff|Employee) Directory(\s|$|,))|(^Faculty$)|(^Faculty\s*(&|and)\s*Staff$)|(^Staff$)|(^Staff Contact)|(^[A-Z]+\sDirectory)/i,
                     find_base:this.find_base_blackboard,
					 authorization:"Bearer eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0.SDqE_Kj0BMGSLMBmwYjZetqj73xn3_B5O7R7GRLRlR3t22A4rYWkrJkuD6_ga4LAhYBRJEmONCZeYSea0hoRp_LLND-lzwIC.-LcfuorI-k98p5SEbumQeg.uKtdeHIvYKK9P3dumnPk4by5ghOLyDc_UYLyfdfsLfd0vvAbJly0N8ZU7GH2Z5xN7T3I5Q0Mp-D_H9Qvu0NxzEL7mZgeHzf-_n4fbGd12E4gl30jhLxMyfAQJva-czkijMVBjsjb_AQYExwGOkTDcdFXIZWCZ9PcTceDayiTCzEJr0mnNqZj0rcYt3kzS5x8K6weZoJi7Prukw21WZPZNpBda5uIz72G1hWFzFR779036ElH7QhckYX3GeXQh295ZSRCiGyifs6uYrqAnpH_OA.CLmzWwXW6NfR46jfUEXuuyafZ-iu8sjrF7kGA3w8XIQ"
					 };
    this.catapultk12={parser:this.parse_catapultk12,find_directory:this.find_dir,href_rx:/\/Staff-Directory/,text_rx:/Directory/i};
    this.cyberschool={parser:this.parse_cyberschool,suffix:/\/District\/Staff/};
    this.echalk={parser:this.parse_echalk,base_suffix:"/directory/school",suffix:"/directory/faculty",find_base:this.find_base_echalk};
    this.edlio={parser:this.parse_edlio,suffix:"/apps/staff"};
    this.educationalnetworks={parser:this.parse_educationalnetworks,suffix:"/apps/staff"};
    this.eschoolview={parser:this.parse_eschoolview,find_directory:this.find_dir_eschoolview};
    this.finalsite={parser:this.parse_finalsite,href_rx:/.*/i,text_rx:/(^Staff$)|Staff Directory*|Teacher Pages/i,find_directory:this.find_dir};
    this.foxbright={parser:this.parse_foxbright,href_rx:/.*/i,text_rx:/Staff Directory*/i,find_directory:this.find_dir};

    this.gabbart={parser:this.parse_gabbart,href_rx:/.*/i,text_rx:/.*Directory/i,find_directory:this.find_dir};
    this.campussuite={parser:this.parse_campussuite,href_rx:/staff-directory/i,text_rx:/.*/,find_directory:this.find_dir};
    this.schoolblocks={parser:this.parse_schoolblocks,suffix:"/staff"};
    this.schoolpointe={parser:this.parse_schoolpointe,suffix:"/staff"};
    this.schoolmessenger={parser:this.parse_schoolmessenger,href_rx:/.*/i,text_rx:/^(((Staff )?(Information|Directory))|(Staff$))/i,find_directory:this.find_dir,
                          find_base:this.find_base_schoolmessenger};
    this.page_regex_str="(www\\.|\/\/)(apptegy|catapultk12|cms4schools)\\.com|(www\\.4lpi\\.com)|adventistschoolconnect\\.org|"+
	"www\\.campussuite\\.com|crescerance\\.com|cyberschool\\.com|"+
        "echalk\\.com|(edlio(school)?\\.com)|edline\\.net|educationalnetworks\\.net|"+
        "eschoolview\\.com|\/\/factsmgt\\.com|finalsite\\.com|foxbright\\.com|gabbart\\.com|gaggle\\.net|ilearnschools\\.org|"+
	"www\\.osvoffertory\\.com|\\.renweb\\.com|"+
        "schooldesk\\.net|schoolloop\\.com|"+
        "www\\.school(blocks|insites|messenger|pointe|webmasters)\\.com|"+
		"schoolblocks\.com|"+
        "socs\\.fes\\.org|www\\.(weebly|zumu)\\.com";
    this.page_map={"edlioschool":"edlio","renweb":"factsmgt"};
    this.script_regex_lst=[{regex:/apptegy_cms\//,name:"apptegy"}];
    for(x in query) this[x]=query[x];
    this.name=this.name.replace(/\s*\(.*$/,"");
    var title_str_dept="^(";
    if(this.title_str) {
        for(x of this.title_str) title_str_dept+=(title_str_dept.length>2?"|":"")+x;
        title_str_dept+=")";
        this.title_str_regex=new RegExp(title_str_dept);
    }
    // console.log("this.title_regex.length="+this.title_regex.length);
    var self={bad_urls:this.bad_urls};
    var promise=new Promise((resolve,reject) => {
        this.init();
    });
    promise.then(then_func).catch(catch_func);


}
/* Consolidate contacts */
School.prototype.consolidate_contacts=function(self) {
	function cmp_contacts(a,b) {
		if(a.name===b.name) {
			if(a.email && !b.email) return -1;
			else if(!a.email && b.email) return 1;
			else if(a.title && !b.title) return -1;
			else if(!a.title && b.title) return 1;
			else if(a.phone && !b.phone) return -1;
			else if(!a.phone && b.phone) return -1;
			else return 0;
		}
		if(a.name < b.name) return -1;
		else if(a.name>b.name) return 1;
		else return 0;
	}
	self.contact_list.sort(cmp_contacts);
	console.log("pre-consolidation, contacts=");
	console.log(self.contact_list);
	var i;
	for(i=self.contact_list.length-1;i>0;i--) {
		if(self.contact_list[i].name===self.contact_list[i-1].name) {
			self.contact_list.splice(i,1);
		}
	}
	
	
};


School.prototype.is_bad_link=function(url) {
    url=url.toLowerCase();
    if(/^mailto|javascript|tel/.test(url)||/\.pdf$/.test(url)) return true;
    return false;
};


School.prototype.find_phone=function(doc,url) {
    var schoolphone,phone,match;
    var phone_re_str_begin="(?:Tel|Telephone|Phone|Ph|P|T):\\s*";
    var phone_re_str_end="([(]?[0-9]{3}[)]?[-\\s\\.\\/]+[0-9]{3}[-\\s\\.\\/]+[0-9]{4,6}(\\s*(x|ext\\.?)\\s*[\\d]{1,5})?)";
    var ext_phone_re=new RegExp(phone_re_str_begin+phone_re_str_end,"i");
    if((schoolphone=doc.querySelector("a[href^='tel:']"))) phone=schoolphone.innerText.trim();
    else if(!phone && (match=doc.body.innerHTML.match(ext_phone_re))) phone=match[1];
    // else if((match=doc.body.innerHTML.match(phone_re))) console.log("phone alone match="+match);
    if(phone) this.phone=phone;
    return phone;
};

/**
 * Do a search for links, up to a certain depth */
School.prototype.search_none=function(doc,url,resolve,reject,extra) {
    var self=extra.self,depth=extra.depth;
    console.log("search_none,url="+url+", depth="+depth);
    var MAX_QUERIES=15;
    var good_link_str="(^(Admin|District|Central|Personnel|Employee|Staff))|Administration|Contact|Directory|Staff|About|Leadership|Team|Departments|Faculty";
    if(depth>0) good_link_str="(^(Admin|District|Central|Personnel|Employee|Contact|Directory|Staff|About|Leadership|Team|Departments|Faculty))";
    var good_link_re=new RegExp(good_link_str,"i");
    var i,links=doc.links,promise_list=[];
    for(i=0;i<links.length;i++) {
        links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
        links[i].innerText=links[i].innerText.trim();
        //console.log("links["+i+"].innerText="+links[i].innerText+", href="+links[i].href);
	
        if(
           links[i].href.indexOf(self.base.replace(/^(https:\/\/[^\/]*).*$/,"$1"))!==-1 &&

           (self.title_str_regex.test(links[i].innerText.trim()) ||
            good_link_re.test(links[i].innerText.trim())) && links[i].innerText.length<40 && !self.is_bad_link(links[i].href)
           && !self.query_list.includes(links[i].href) && self.query_list.length<MAX_QUERIES
          ) {
            console.log("@@: links["+i+"].innerText="+links[i].innerText+", href="+links[i].href+", TITLE_MATCH="+(self.title_str_regex.test(links[i].innerText)));
            self.query_list.push(links[i].href);
            var dept_regex_lst=["staff","STAFF"];

            var title_regex_lst=self.title_regex;
            //var promise=MTP.create_promise(
            Gov.query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
            promise_list.push(MTP.create_promise(links[i].href,Gov.load_scripts,function() { console.log("Resolved at depth"+depth); },
                                                 MTP.my_catch_func,{}));
            if(depth<1) {
                promise_list.push(MTP.create_promise(links[i].href,self.search_none,MTP.my_then_func,MTP.my_catch_func,{self:self,depth:depth+1}));
            }
        }
    }
    //console.log("query_list="+JSON.stringify(query_list));
    Promise.all(promise_list).then(function(ret) {
        let i,curr,match;
        for(i=0;i<Gov.contact_list.length;i++) {
            curr=Gov.contact_list[i];
            console.log("Gov.contact_list["+i+"]="+JSON.stringify(curr));
            if(curr.title && self.matches_title_regex(curr.title)) {
                if(!curr.phone && self.phone) curr.phone=self.phone;
                if(curr.email&&(match=curr.email.match(email_re))) curr.email=match[0];
                if(!curr.url) curr.url=url;
                self.contact_list.push(curr);
            }
        }
        resolve(self);
    }).catch(function(error) {
        console.log("Error: "+error); });

};
School.prototype.parse_none=function(doc,url,resolve,reject,self) {
    self.query_list=[];
    var title_str_dept="^(",x;
    for(x of self.title_str) title_str_dept+=(title_str_dept.length>2?"|":"")+x;
    title_str_dept+=")";
    self.title_str_regex=new RegExp(title_str_dept);
    console.log("* self.title_str_regex="+self.title_str_regex);
    var promise_list=[],i,links=doc.links,query_list=[],schoolphone,phone;
    self.phone=self.find_phone(doc,url);
    var promise=MTP.create_promise(url,self.search_none,resolve,reject,{self:self,depth:0});
};
School.prototype.parse_foxbright=function(doc,url,resolve,reject,self) {
    console.log("parse_foxbright,url="+url);
    var headers={"Content-Type":"application/x-www-form-urlencoded","host":self.base.replace(/https?:\/\//,""),
                 "origin":self.base,"referer":url,
                 "Upgrade-Insecure-Requests": "1"};
    var data_str="FromStaffSearchPage=true&SearchFirst=False&SearchString=&BuildingId=&DepartmentId=&PositionId=3";
    var pos_select=doc.querySelector("#fbcms_staff_search_position"),promise_list=[],i,pos_list=[],temp_promise;
    if(!pos_select && (resolve(self)||true)) return;
    for(i=0;i<pos_select.options.length;i++) {
        if(self.matches_title_regex(pos_select.options[i].innerText.trim())) pos_list.push(pos_select.options[i].value);
    }
    for(i=0;i<pos_list.length;i++) {
        data_str="FromStaffSearchPage=true&SearchFirst=False&SearchString=&BuildingId=&DepartmentId=&PositionId="+(pos_list[i].toString());
        temp_promise=new Promise((resolve1,reject1) => {
            GM_xmlhttpRequest({method: 'POST', url:url,data:data_str,headers:headers,
                               onload: function(response) {
                                   var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                                   self.parse_foxbright_response(doc,response.finalUrl,resolve1,reject1,self) },
                               onerror: function(response) { reject("Fail"); },
                               ontimeout: function(response) { reject("Fail"); }
                              });
        }).then(MTP.my_then_func).catch(MTP.my_catch_func);
        promise_list.push(temp_promise);
    }
    Promise.all(promise_list).then(function(result) {
        resolve(self); });
};
School.prototype.parse_foxbright_response=function(doc,url,resolve,reject,self) {
    console.log("parse_foxbright_response,url="+url);
    var domain=MTP.get_domain_only(self.base,true);
    var elem,data=doc.querySelectorAll(".fbcms_staff_search_results .data"),curr,x,field;
    var term_map={".name":"name",".position":"title",".phone":"phone",".department":"department"};
    for(elem of data) {
        curr={url:url};
        for(x in term_map) {
            if((field=elem.querySelector(x))) curr[term_map[x]]=field.innerText.trim();
            if(x===".name" && (field=elem.querySelector(x))) curr[term_map[x]]=field.innerText.trim().replace(/^([^,]*),\s*([^,]*)/,"$2 $1");
        }
        let fullname=MTP.parse_name(curr.name);
        curr.email=fullname.fname.toLowerCase().charAt(0)+fullname.lname.toLowerCase()+"@"+domain;
        self.contact_list.push(curr);
    }
    resolve("");

};
School.prototype.parse_schoolpointe=function(doc,url,resolve,reject,self) {
    var headers={"Content-Type": "application/x-www-form-urlencoded","host":self.base.replace(/https?:\/\//,"").replace(/\/.*$/,""),
                 "origin":self.base,
                 "referer":url};
    self.phone=self.find_phone(doc,url);
	
	try 
	{

    //console.log("headers="+JSON.stringify(headers));
    var form=doc.querySelector("form[id='aspnetForm']"),x;
    var data={},inp=form.querySelectorAll("input[name^='ctl00'][type='text'],input[name^='ctl00'][type='hidden'],select[name^='ctl00'],input[type='hidden']"),i,data_str;
    for(i=0;i<inp.length;i++) data[inp[i].name]=inp[i].value;
    //console.log("data="+JSON.stringify(data));
    var submit=doc.querySelector("[title='Submit']");
    if(!submit) {
        let promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);
        return;
    }
    var rect=submit.getBoundingClientRect();
    //for(x in data) { console.log(x+"="+data[x].substr(0,100)+" ?...?"); }
    data["ctl00$ctl00$MasterContent$ContentColumnRight$ctl01$ib_submit.x"]=rect.x+rect.width/2
    data["ctl00$ctl00$MasterContent$ContentColumnRight$ctl01$ib_submit.y"]=rect.y+rect.height/2
    //var x;

    data_str=MTP.json_to_post(data).replace(/%20/g,"+");
    GM_xmlhttpRequest({method: 'POST', url: url,data:data_str,headers:headers,
                       onload: function(response) {
                           console.log("BEGIN_DIR: response="+JSON.stringify(response));
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           self.parse_schoolpointe_response(doc,response.finalUrl, resolve, reject,self); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
	}
	catch(e) {
		console.warn("Failed schoolpointe, ",e);
		        let temp_promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);

	}
};
School.prototype.parse_schoolpointe_response=function(doc,url,resolve,reject,self) {
    console.log("in parse_schoolpointe_response, url="+url);
    var table=doc.querySelector(".staff-table"),row,cell,i,curr,split,fullname,promise_list=[],a;
    if(table) {
        // console.log("table="+table.innerText);
        for(i=0;i<table.rows.length;i++) {
            curr={};
            row=table.rows[i];
            //console.log("row["+i+"].length="+row.cells.length+",row["+i+"]="+row.innerText);
            split=row.cells[0].innerText.trim().split(/\s+-\s+/);
            fullname=MTP.parse_name(split[0].trim());
            if(fullname) curr.name=fullname.fname+" "+fullname.lname;
            if(split.length>1) curr.title=split[1].trim();
            a=row.cells[row.cells.length-1].querySelector("a");
            a.href=MTP.fix_remote_url(a.href,url);
            //console.log("i="+i+",curr="+JSON.stringify(curr));
            if(curr.title&&self.matches_title_regex(curr.title)) {
                promise_list.push(MTP.create_promise(a,self.parse_schoolpointe_profile,MTP.my_then_func,MTP.my_catch_func,self)); }
        }
    }
    Promise.all(promise_list).then(function() { resolve(self); });
};
School.prototype.parse_schoolpointe_profile=function(doc,url,resolve,reject,self) {
    var curr={url:url},fields=doc.querySelectorAll(".field"),i,label,content,label_text;
    var terms=["name","title","phone","email","department","buildings"];
    for(i=0;i<fields.length;i++) {
        label=fields[i].querySelector(".field-label");
        content=fields[i].querySelector(".field-content");
        if(label && content && (label_text=label.innerText.trim().replace(/:.*$/,"").toLowerCase()) && terms.includes(label_text)) {

            curr[label_text]=content.innerText.trim();
        }
    }
    if(!curr.phone && self.phone) curr.phone=self.phone;
    else if(self.phone&&curr.phone&curr.phone.length<7) curr.phone=self.phone+(/[A-Za-z]+/.test(curr.phone)?" ":" x")+curr.phone;
    self.contact_list.push(curr);
    resolve();
};


/* Converts cyberschools and IES email from encoded form */
School.prototype.convert_cyberschools_email=function(text) {
    var split_text=[],i,ret="";
    /* map to correct character */
    function get_value(char) {
        if(/^[A-Z]+/.test(char)) return (char.charCodeAt(0)-65);
        else if(/^[a-z]+/.test(char)) return (26+char.charCodeAt(0)-97);
        else if(/^[0-9]+/.test(char)) return (52+char.charCodeAt(0)-48);
        else {
            console.log("Got a non-alphanumeric character"); return -1; }
    }
    /* get the first character */
    function get_first(text) { return text.length>=2 ? String.fromCharCode(get_value(text.charAt(0))*4+get_value(text.charAt(1))/16) : ""; }
    function get_second(text) { return text.length>=3 ? String.fromCharCode((get_value(text.charAt(1))%16)*16+get_value(text.charAt(2))/4) : ""; }
    function get_third(text) { return text.length>=4 ? String.fromCharCode((get_value(text.charAt(2))%4)*64+get_value(text.charAt(3))): ""; }
    for(i=0;i<text.length;i+=4) split_text.push(text.substr(i,4));
    for(i=0;i<split_text.length; i++) {
        split_text[i]=split_text[i].replace(/\=/g,"");
        ret=ret+get_first(split_text[i])+get_second(split_text[i])+get_third(split_text[i]);
    }
    return ret;

};

School.prototype.parse_cyberschool=function(doc,url,resolve,reject,self) {
    console.log("in School.prototype.parse_cyberschool at url="+url);
    var staff=doc.querySelectorAll(".staffContainer"),i,curr,name,staffInfo,title;
    var promise_list=[],a;
    try {
        for(i=0;i<staff.length;i++) {
            staffInfo=staff[i].querySelector(".staffInfo").parentNode;
            title=staffInfo.innerText.replace(/^[^:]*:\s*/,"");
            if(self.matches_title_regex(title) && (a=staff[i].querySelector("a"))) {
                a.href=MTP.fix_remote_url(a.href,url);
                promise_list.push(MTP.create_promise(a.href,self.parse_cyberschool_profile,MTP.my_then_func,MTP.my_catch_func,self));
            }
        }
    }
    catch(error) {
        console.log("error="+error);
        let temp_promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);
        return;
    }
    Promise.all(promise_list).then(function() {
        resolve(self);
        //let promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);
    });
};
/* Parse an individual cyberschool profile */
School.prototype.parse_cyberschool_profile=function(doc,url,resolve,reject,self) {
    var curr={url:url},p,i;
    var profileIntro=doc.querySelector(".profileIntro"),userTitle=doc.querySelector(".userTitle dd");
    var email=doc.querySelector(".emailAddress a"),match,name=doc.querySelector(".PR_Title");
    if(email && email.href && (match=email.href.match(/\?e\=(.*)$/))) curr.email=self.convert_cyberschools_email(match[1]);
    if(name) curr.name=name.innerText.trim();
    if(userTitle) curr.title=userTitle.innerText.trim();
    if((match=profileIntro.innerText.match(phone_re))) curr.phone=match[0].trim();
    if(curr.name && curr.title && curr.email) self.contact_list.push(curr);
    resolve("");
};
School.prototype.parse_catapultk12=function(doc,url,resolve,reject,self) {
    var i,scripts=doc.scripts;
    function padStr(i) { return (i < 10) ? "0" + i : "" + i; }
    function printDate() {
        var t = new Date();
        return padStr(t.getFullYear())+padStr(1+t.getMonth())+padStr(t.getDate())+
            padStr(t.getHours())+padStr(t.getMinutes())+padStr(t.getSeconds());
    }
    console.log("In parse_catapultk12 at "+url);
    var token,t_match,t_reg=/\'AuthorizationToken\':\s*\'([^\']+)\'/;
    var prog_url,p_match,p_reg=/\'ProgramUrl\':\s*'([^\']+)\'/;
    for(i=0;i<scripts.length;i++) {
        if(/^\s*CatapultSD/.test(scripts[i].innerHTML)) {
            console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
            if((p_match=scripts[i].innerHTML.match(p_reg)) && (prog_url=p_match[1]) &&
               (t_match=scripts[i].innerHTML.match(t_reg)) && (token=t_match[1])) break;
        }
    }
    if(token && prog_url) { console.log("token="+token); console.log("prog_url="+prog_url); }
    var full_url=prog_url+"/Connector/StaffList/All/LastName/All/false/NotSet/NotSet?"+printDate()+"&{}";
    var headers={'Content-Type':'application/json; charset=utf-8','CatapultSDAuthToken':token};
    console.log("full_url="+full_url);
    GM_xmlhttpRequest({method: 'GET', url: full_url,headers:headers,
                       onload: function(response) { self.parse_catapultk12_finish(response, resolve, reject,self,full_url); },
                       onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
};
/* Schools.parse_catapultk12_finish is a JSON list */
School.prototype.parse_catapultk12_finish=function(response,resolve,reject,self,full_url) {
    var result=[],i,curr_field,sites,temp_contact_list;
    try {
        temp_contact_list=JSON.parse(response.responseText); }
    catch(error) { console.log("Error parsing catapultk12, "+error);
                   // console.log("response.responseText="+response.responseText);
                   var promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);

                   return; }
    console.log(response.responseText);
    for(i=0;i<temp_contact_list.length;i++) {
        //console.log("temp_contact_list["+i+"]="+JSON.stringify(temp_contact_list[i]));
        if(temp_contact_list[i].StaffSites===undefined || temp_contact_list[i].StaffSites.length===0) continue;
        else sites=temp_contact_list[i].StaffSites[0];
        curr_field={first:temp_contact_list[i].FirstName,last:temp_contact_list[i].LastName,
                    name:temp_contact_list[i].FirstName+" "+temp_contact_list[i].LastName,
                    title:sites.Position,phone:sites.SitePhoneNumber+(sites.PhoneExt && sites.PhoneExt.length>0 ? ' x'+sites.PhoneExt : ''),
                    email:temp_contact_list[i].Email,department:sites.department,school:sites.SiteName,url:full_url};
        // console.log("curr_field["+i+"]="+JSON.stringify(curr_field));
        if(self.matches_title_regex(curr_field.title)) self.contact_list.push(curr_field);
    }
    resolve(self);
};
School.prototype.parse_finalsite=function(doc,url,resolve,reject,self) {
    console.log("in School.prototype.parse_finalsite at url="+url);
    var items=doc.querySelectorAll(".fsElementPagination a"),promise_list=[],i;
    var directory=doc.querySelector(".fsDirectory");
    if(!directory) {
        console.log("No directory");
        resolve(self);
        return;
    }
    var dir_el_num=directory.id.replace(/[^\d]*/g,"");
    var begin_url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1");
    begin_url=begin_url+"/fs/elements/"+dir_el_num+"?const_page=1&_=111";  // hopefully constant _ is fine?
    if(items.length>0) {
        console.log("items[0].href=",items[0].href);
    }
    self.phone=self.find_phone(doc,url);
    promise_list.push(new Promise((resolve1,reject1) =>
                                  { self.parse_finalsite_fsPageLayout(doc,url,resolve1,reject1,self); }).then(MTP.my_then_func).catch(MTP.my_catch_func));
    var my_a=doc.querySelector(".fsLastPageLink"),last,curr_href;
    if(my_a&&(doc.querySelector(".fsDirEntry")||doc.querySelector(".fsConstituentItem"))) {
        my_a.href=url+my_a.href.replace(/^[^\?]*/,"");
        last=parseInt(my_a.dataset.page);
        for(i=2;i<=last;i++) {
            curr_href=begin_url.replace(/const_page\=[\d]+/,"const_page="+i);
            //items[i].href=url+items[i].href.replace(/^[^\?]*/,"");
            console.log("curr_href="+curr_href);
            promise_list.push(MTP.create_promise(curr_href,self.parse_finalsite_fsPageLayout,MTP.my_then_func,MTP.my_catch_func,self));
        }
    }
    console.log((promise_list.length>0?"RIGHT":"WRONG")+" TYPE of finalsite, "+promise_list.length);
    Promise.all(promise_list).then(function() { resolve(self); }).catch(function() { resolve(self); });
};
School.prototype.parse_finalsite_fsPageLayout=function(doc,url,resolve,reject,self) {
    console.log("in School.prototype.parse_finalsite_fsPageLayout at url="+url);
    // Two types (at least) of entries, .fsConsituentItem and .fsDirEntry
	var promise_list=[];
    promise_list=self.parse_finalsite_fsConstituentItem(doc,url,resolve,reject,self);
	
	if(promise_list.length===0) {
		self.parse_finalsite_fsDirEntry(doc,url,resolve,reject,self);

		resolve("");
	}
	else {
		Promise.all(promise_list).then(resolve);
	}
};
School.prototype.parse_finalsite_fsConstituentItem=function(doc,url,resolve,reject,self) {
    var items=doc.querySelectorAll(".fsConstituentItem"),i,curr={},title,phone,emailscript,match;
    var colon_re=/^[^:]*:/;
	var promise_list=[];
	var full_section=doc.querySelector(".fsDirectory");
	
	var full_sec_prefix=full_section.id.match(/[\d]+$/);
	console.log("prefix="+full_sec_prefix);
	var curr_person_link,curr_person_num;

    var fsemail_re=/insertEmail\(\"([^\"]*)\",\s*\"([^\"]*)\",\s*\"([^\"]*)\"/;
    console.log("items.length="+items.length);
    for(i=0;i<items.length;i++) {
        curr={};
        let full1=items[i].querySelector(".fsFullName a"),full2=items[i].querySelector("h3.fsFullName");
        curr.name=full1?full1.innerText.trim():(full2?full2.innerText.trim():"");
        if((title=items[i].querySelector(".fsTitles"))) curr.title=title.innerText.replace(colon_re,"").trim();
        if((phone=items[i].querySelector(".fsPhones a"))) curr.phone=phone.innerText.trim();
        if((emailscript=items[i].querySelector(".fsEmail script")) &&
           (match=emailscript.innerHTML.match(fsemail_re))) curr.email=match[3].split("").reverse().join("")+"@"+match[2].split("").reverse().join("");;
        console.log("("+i+"), curr="+JSON.stringify(curr));
        if(!curr.phone && self.phone) curr.phone=self.phone;
        curr.url=url;
		if(!curr.email&&full_sec_prefix && (curr_person_link=items[i].querySelector(".fsConstituentProfileLink")) && (curr_person_num=curr_person_link.dataset.constituentId)) {
			let temp_url=self.base+"/fs/elements/"+full_sec_prefix[0]+"?const_id="+curr_person_num+"&show_profile=true&is_draft=false";
			console.log("temp_url="+temp_url);
	
			promise_list.push(MTP.create_promise(temp_url,self.parse_finalsite_profile,function() { },function(response) { console.log("Fail "+response); }, self));
			
		}
        else if(curr.title && self.matches_title_regex(curr.title)) self.contact_list.push(curr);
    }
    return promise_list;
};

School.prototype.parse_finalsite_profile=function(doc,url,resolve,reject,self) {
	console.log("url="+url);
	var curr={};
	var emailscript,phone,match;
	    var fsemail_re=/insertEmail\(\"([^\"]*)\",\s*\"([^\"]*)\",\s*\"([^\"]*)\"/;

	curr.first=doc.querySelector(".fsFullNameFirst")?doc.querySelector(".fsFullNameFirst").innerText.trim():"";
	curr.last=doc.querySelector(".fsFullNameLast")?doc.querySelector(".fsFullNameLast").innerText.trim():"";
	curr.name=curr.first+" "+curr.last;
	curr.title=doc.querySelector(".fsTitle .fsProfileSectionFieldValue")?doc.querySelector(".fsTitle .fsProfileSectionFieldValue").innerText.trim():"";
	curr.department=doc.querySelector(".fsDepartment .fsProfileSectionFieldValue")?
	doc.querySelector(".fsDepartment .fsProfileSectionFieldValue").innerText.trim():"";
	if((emailscript=doc.querySelector(".fsEmail script")) &&
           (match=emailscript.innerHTML.match(fsemail_re))) curr.email=match[3].split("").reverse().join("")+"@"+match[2].split("").reverse().join("");
	if((phone=doc.querySelectorAll(".fsPhone div")) && phone.length>=2) {
	curr.phone=phone[1].innerText.trim(); }
	if(curr.name && curr.title) {
		self.contact_list.push(curr);
	}
	resolve("");

	
	
	
};

School.prototype.parse_finalsite_fsDirEntry=function(doc,url,resolve,reject,self) {
    var items=doc.querySelectorAll(".fsDirEntry"),i,curr={},title,phone,emailscript,match;
    var colon_re=/^[^:]*:/;
    var mailMe_re=/mailMe\(\'([^\']*)\'\)/;
    var entry,mail1;
    for(entry of items) {
        curr={};
        let full1=entry.querySelector(".fsDirEntryName");
        curr.name=full1?full1.innerText.trim():"";
        if((title=entry.querySelector(".fsDirEntryTitle"))) curr.title=title.innerText.replace(colon_re,"").trim();
        if((phone=entry.querySelector(".fsDirEntryPhone a"))) curr.phone=phone.innerText.trim().replace(/\([^\)]*\)\s*$/,"").trim();
        if((mail1=entry.querySelector("a[onclick^='mailMe']")) && (mail1.onclick) && (match=mail1.onclick.match(mailMe_re))) {
            let curr_mail=decodeURIComponent(match[1]).replace("[nospam]","@");
            curr.email=curr_mail;
        }
        console.log("("+i+"), curr="+JSON.stringify(curr));
        if(!curr.phone && self.phone) curr.phone=self.phone;
        curr.url=url;
        if(curr.title && self.matches_title_regex(curr.title)) self.contact_list.push(curr);
    }
    return;
};



School.prototype.parse_gabbart=function(doc,url,resolve,reject,self) {
    console.log("in School.prototype.parse_gabbart at url="+url);
    var items=doc.querySelectorAll(".pagination a"),promise_list=[],i;
    promise_list.push(new Promise((resolve1,reject1) =>
                                  { self.parse_gabbart_page(doc,url,resolve1,reject1,self); }).then(MTP.my_then_func).catch(MTP.my_catch_func));
    var my_a=doc.querySelector(".fsLastPageLink"),last,curr_href;
    var url_list=[];
    for(i=0;i<items.length;i++) {
        if(items[i].href&&(items[i].href=MTP.fix_remote_url(items[i].href,url)) && !url_list.includes(items[i].href))
        {
            url_list.push(items[i].href);
            console.log("items["+i+"].href="+items[i].href);
            promise_list.push(MTP.create_promise(items[i].href,self.parse_gabbart_page,MTP.my_then_func,MTP.my_catch_func,self));
        }
    }



    console.log((promise_list.length>0?"RIGHT":"WRONG")+" TYPE of gabbart, "+promise_list.length);

    Promise.all(promise_list).then(function() { resolve(self); });

};

School.prototype.parse_gabbart_page=function(doc,url,resolve,reject,self) {
    var items=doc.querySelectorAll(".col-lg-4.col-sm-4.text-center"),i,curr={},name,title,phone,email,match,schoolphone;
    if((schoolphone=doc.querySelector("a[href^='tel:']"))) phone=schoolphone.innerText.trim();
    console.log("items.length="+items.length);
    for(i=0;i<items.length;i++) {
        curr={};
        curr.url=url;
        if((name=items[i].querySelector("h3 a.smallTitle"))) {
			let name_str="";
			let c;
			curr.name=name.innerText.trim().replace(/([^,]*),\s*(.*)$/g,"$2  $1");
			if(!/\s/.test(curr.name)) {
				for(c of name.childNodes) {
					if(c.nodeType===Node.TEXT_NODE) {
						name_str=name_str+(name_str.length>0?" ":"")+c.textContent;
					}
				}
				curr.name=name_str;
			}
            //if(fullname&&fullname.fname&&fullname.lname) curr.name=fullname.fname+" "+fullname.lname;
        }
        if(phone) curr.phone=phone;
        if((title=items[i].querySelector("h3 .capt"))) curr.title=title.innerText.trim();
        if((email=items[i].querySelector("a[href*='@']"))) curr.email=email.href.replace(/^\s*mailto:\s*/,"");
        console.log(url.replace(self.base+"/","")+": ("+i+"), curr="+JSON.stringify(curr));
        if(curr.title && self.matches_title_regex(curr.title)) self.contact_list.push(curr);
    }
    resolve("");
};


School.prototype.parse_campussuite=function(doc,url,resolve,reject,self) {
    console.log("in School.prototype.parse_campussuite at url="+url);
    var i,x,temp;
    var term_map={".cs-profile-li-name":"name",".cs-profile-li-title":"title",".cs-profile-li-meta-phone":"phone",
                  ".cs-profile-li-meta-email":"email"};
    var profiles=doc.querySelectorAll(".cs-profile-li"),curr,name,title,phone,email;
    for(i=0;i<profiles.length;i++) {
        curr={};
        curr.url=url;
        for(x in term_map) {
            if((temp=profiles[i].querySelector(x))) curr[term_map[x]]=temp.innerText.trim();
        }
        if(curr.title && self.matches_title_regex(curr.title)) self.contact_list.push(curr);
    }
    resolve(self);

};

School.prototype.fix_generator=function(generator_str) {
    var match,gen_regex=/(?:^|[^A-Za-z]{1})(Joomla|Drupal|Starfield Technologies|One\.com|Wix\.com)(?:$|[^A-Za-z]{1})/;
    if(match=generator_str.match(gen_regex)) return match[1].replace(/\.com/g,"");
    generator_str=generator_str.replace(/(^|;)Powered By /ig,"$1");
    generator_str=generator_str.replace(/\s(v\.)?[\d]+\.[\d]+[\.\d]*\s*/g,"");
    if(/^WordPress/i.test(generator_str)) generator_str=generator_str.replace(/;WordPress/ig,"");
    return generator_str;
};


/**
 * convert_ednetworks_email converts
 * emails for the educational networks websites (edlio some places?)
 * input value text comes from either <input type="hidden" name="e" value="([\d]+),?"> or
 * from urls with e=([\d]+)
 */
School.prototype.convert_ednetworks_email=function(text) {
    var i, split_text=[],ret_text="",dot_char=9999,curr_char;
    /* Split into 4 character chunks */
    for(i=0; i < text.length; i+=4) split_text.push(text.substr(i,4));
    /** Take the 3rd chunk from right if smaller than 4th (i.e.in case it's .k12.XX.us) **/
    for(i=0; i < split_text.length; i++) if((curr_char=parseInt(split_text[i]))<dot_char) dot_char=curr_char;
    /* 46 is char code for "." */
    for(i=0; i < split_text.length; i++) ret_text=ret_text+String.fromCharCode(46+(parseInt(split_text[i])-dot_char)/2);
    return ret_text.replace(/^mailto:/,"");
};
School.prototype.parse_edlio=function(doc,url,resolve,reject,self) {
    console.log("in School.prototype.parse_edlio at url="+url);
    var schoolphone,phone;

    //        if((schoolphone=doc.querySelector("a[href^='tel:']"))) phone=schoolphone.innerText.trim();
    phone=self.find_phone(doc,url);
    var footer=doc.querySelector("footer"),match,promise_list=[],i,curr={},curr_elem,x;
    self.phone=self.schoolPhone=phone?phone:"";
    var my_phone_re=/(?:Phone|Tel|T):\?\s*([(]?[0-9]{3}[)]?[-\\s\\.\\/]+[0-9]{3}[-\\s\\.\\/]+[0-9]{4,6})/;
    // if(footer && (match=footer.innerText.match(my_phone_re))) self.schoolPhone=match[1];
    
    var staff=doc.querySelectorAll(".staff");
    for(i=0;i<staff.length;i++) {
        // console.log("("+i+"): "+staff[i].innerHTML);
        curr={};
        curr_elem={name:staff[i].querySelector(".name"),title:staff[i].querySelector(".user-position"),
                   phone:staff[i].querySelector(".user-phone"),email:staff[i].querySelector(".email")};
        for(x in curr_elem) curr[x]=curr_elem[x]?curr_elem[x].innerText.trim():"";
        if(/^(x|ext)/.test(curr.phone)) curr.phone=self.schoolPhone+(self.schoolPhone.length>0?" ":"")+curr.phone;
        curr.url=url;
        console.log("curr_elem["+i+"]="+JSON.stringify(curr_elem)+", curr["+i+"]="+JSON.stringify(curr));
        if(self.matches_title_regex(curr.title)) {
            // check if we already can get email with no further queries

            if(curr_elem.email && curr_elem.email.href && (match=curr_elem.email.href.match(/\?e\=([\d]*)/))) {
                console.log("Matched e=");
                curr.email=self.convert_ednetworks_email(match[1]);
                self.contact_list.push(curr);
            }
            else if(curr_elem.email&&curr_elem.email.href && (match=curr_elem.email.href.match(/^mailto:\s*(.*@.*)$/))) {
                console.log("Matched mailto");

                curr.email=match[1];
                if(!curr.phone && phone) curr.phone=phone;
                //  else if(curr.phone&&curr.phone.length<6 && phone) curr.phone=phone+(/[A-Za-z]/.test(phone)?" ":" x")+curr.phone;
                self.contact_list.push(curr);
            }
			else if(curr_elem.email&&curr_elem.email.href && curr_elem.email.title && /@/.test(curr_elem.email.title)) {
                console.log("Matched title=",curr_elem.email.title);

                curr.email=curr_elem.email.title;
                if(!curr.phone && phone) curr.phone=phone;
                //  else if(curr.phone&&curr.phone.length<6 && phone) curr.phone=phone+(/[A-Za-z]/.test(phone)?" ":" x")+curr.phone;
                self.contact_list.push(curr);
            }
            else {
                if(curr_elem.email) console.log("curr_elem.email.outerHTML="+curr_elem.email.outerHTML);
                var the_url=MTP.fix_remote_url(staff[i].querySelector("a").href,url);
                if(the_url.indexOf("&pREC_ID=contact")===-1) the_url=the_url+"&pREC_ID=contact";
                console.log("the_url["+i+"]="+the_url);
				curr.email="";
				self.contact_list.push(curr);

                promise_list.push(MTP.create_promise(the_url,self.parse_appsstaff_contactpage,MTP.my_try_func,MTP.my_catch_func,
                                                     {self:self,curr:curr}));
            }
        }
    }
    Promise.all(promise_list).then(function() {
        console.log("Done appsstaff");
        resolve(self); });
};

School.prototype.parse_educationalnetworks=function(doc,url,resolve,reject,self) {
    var promise_list=[],promise;
    var i,staff_elem=doc.getElementsByClassName("staff-categoryStaffMember"),person;
    for(i=0; i < staff_elem.length; i++) {
        //    console.log("staff_elem[i]="+staff_elem[i].innerHTML);
        var the_url=MTP.fix_remote_url(staff_elem[i].querySelector("a").href,url);
        person=self.get_appsstaff_nametitle(staff_elem[i]);
	//           console.log("the_url["+i+"]="+the_url+", person="+JSON.stringify(person));
        if(the_url.indexOf("&pREC_ID=contact")===-1) the_url=the_url+"&pREC_ID=contact";
        if(self.matches_title_regex(person.title)) {
            promise_list.push(MTP.create_promise(the_url,self.parse_appsstaff_contactpage,
                                                 MTP.my_then_func,MTP.my_catch_func,{curr:person,self:self}));
        }
    }
    Promise.all(promise_list).then(function() {
        resolve(self); });
};

/* Helper function to get the name and title of a staff member at ednetworks edlio schools on the appsstaff
 * page or the contact page (same format) */
School.prototype.get_appsstaff_nametitle=function(div) {
    var dl,dt,dd,result={name:"",title:""};
    if((dl=div.getElementsByTagName("dl")).length>0) {
        if((dt=dl[0].getElementsByTagName("dt")).length>0) result.name=dt[0].innerText.trim();
        if((dd=dl[0].getElementsByTagName("dd")).length>0) result.title=dd[0].innerText.trim();
    }
    return result;
};


/**
 * parse_appsstaff_contactpage grabs data from a single individual's contact page in
 * create_promise form (incomplete needs work!!!)
 */
School.prototype.parse_appsstaff_contactpage=function(doc,url,resolve,reject,extra) {
    //console.log("parse_appsstaff_contactpage,url="+url);
    var curr=extra.curr,self=extra.self;
    var result={name:"",email:"",phone:"",title:"",url:url},staffOverview,dl,dt,dd,i,ret;
    var contacts=doc.getElementsByClassName("staffContactWrapper"),phone_match;
    if((staffOverview=doc.getElementsByClassName("staffOverview")).length>0) {
        ret=self.get_appsstaff_nametitle(staffOverview[0]);
        result.name=ret.name;
        result.title=ret.title;
    }
    for(i=0; i < contacts.length; i++) if(phone_match=contacts[i].innerText.match(phone_re)) result.phone=phone_match[0];
    if(doc.getElementsByName("e").length>0) {
        result.email=self.convert_ednetworks_email(doc.getElementsByName("e")[0].value.replace(/,/g,""));
        self.contact_list.push(result);
    }
    resolve("");
};
/* Helper function to get the name and title of a staff member at ednetworks edlio schools on the appsstaff
 * page or the contact page (same format) */

School.prototype.parse_schoolblocks=function(doc,url,resolve,reject,self) {
    console.log("in School.prototype.parse_schoolblocks at url="+url);

    var people=doc.querySelectorAll(".sb-block-container.modal-trigger"),i,title,promise_list=[];
    for(i=0;i<people.length;i++) {
        title=people[i].querySelector(".sb-teacher-card-title");
        //console.log("title["+i+"]="+title.innerText.trim());
        if((self.matches_title_regex(title.innerText.trim()))) {
            //  console.log("Matched!");
            var promise=new Promise((resolve,reject) => {
                self.call_schoolblockperson(people[i],url,resolve,reject,self);
            });
            promise.then(MTP.my_then_func).catch(MTP.my_catch_func);
            promise_list.push(promise);
        }
    }
    Promise.all(promise_list).then(function() { resolve(self); });
};
School.prototype.call_schoolblockperson=function(people,url,resolve,reject,self) {
    GM_xmlhttpRequest({method: 'GET', url: self.base+"/_!_API_!_/2/people/"+people.dataset.id,
                       onload: function(response) { self.parse_schoolblockperson(response, resolve, reject,self,self.base+"/_!_API_!_/2/people/"+people.dataset.id); },
                       onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                      });
};
School.prototype.parse_schoolblockperson=function(response,resolve,reject,self,url) {
    var parsed,person;
    try {
        // console.log("response.responseText="+response.responseText);
        parsed=JSON.parse(response.responseText);
        person={name:parsed.fname&&parsed.lname?parsed.fname+" "+parsed.lname:"",url:url,
                title:parsed.title?parsed.title:"",email:parsed.email?parsed.email:"",phone:parsed.phone?parsed.phone:""};
        //console.log("person="+JSON.stringify(person));
        self.contact_list.push(person);

    }
    catch(error) { console.log("Error parsing schoolblocksperson "+error); }
    resolve("");

};
School.prototype.parse_apptegy=function(doc,url,resolve,reject,self) {
	self.staff_dir=url;
    console.log("in School.prototype.parse_apptegy at url="+url);
	if(doc.querySelectorAll(".contact-info,.staff-info").length===0 &&
	!/^staff/.test(url.replace(/https?:\/\/[^\/]*\//,""))) {
        console.log("Retrying apptegy");
        let temp_url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1")+"/staff";
		let promise=MTP.create_promise(temp_url,School.prototype.parse_apptegy,resolve,reject,self);
        return;
	}
    doc.querySelectorAll(".contact-info,.staff-info").forEach(function(elem) { self.parse_apptegy_field(elem,self,url); });
    resolve(self);
};
/* Helper to parse an individual person for Schools.parse_apptegy */
School.prototype.parse_apptegy_field=function(elem,self,url) {
    //  console.log("parse_apptegy_field,elem="+elem.innerText);
    var f_n={"name":"name","title":"title","phone-number":"phone","department":"department","email":"email"};
    var curr_c={url:url},x,curr_f;
    for(x in f_n) if((curr_f=elem.getElementsByClassName(x)).length>0) curr_c[f_n[x]]=curr_f[0].innerText.trim();
    var ext;
    if(curr_c.name && (ext=curr_c.name.match(/\s*Ext.*/i))) {
        if(curr_c.phone) curr_c.phone=curr_c.phone+" "+ext[0];
        curr_c.name=curr_c.name.replace(/\s*Ext.*/i,"");
    }
    if(curr_c.title && self.matches_title_regex(curr_c.title)) self.contact_list.push(curr_c);
    // else console.log("curr_c.title="+curr_c.title);
};

/* toString redef */
School.prototype.toString=function() {
    return JSON.stringify(this.query);
};

/* initialize the school */
School.prototype.init=function() {
    var promise;
    this.try_count=0;
    if(this.url===undefined) { promise=MTP.create_promise(this.get_bing_str(this.name+" "+(this.city||"")+" "+
    (reverse_state_map[this.state]||(this.state||""))+" "),
                                                          this.parse_bing,this.parse_bing_then,this.failed_search_func?this.failed_search_func:MTP.my_catch_func,this); }
    else promise=MTP.create_promise(this.url,this.init_SchoolSearch,this.resolve,this.reject,this);
};
/* TODO: tune */
School.prototype.is_bad_name=function(b_name,p_caption) { if(/(^|[^A-Za-z]{1})(PTO|PTA)($|[^A-Za-z]{1})/.test(b_name)) return true;
                                                          return false; };
School.prototype.get_bing_str=function(str) { return 'https://www.bing.com/search?q='+encodeURIComponent(str)+"&first=1&rdr=1"; };
School.prototype.parse_bing_then=function(result) {
    var promise,self=result.self;
    result.self.url=result.url;
    if(self.url_only && (self.resolve("URL Only")||true)) return;
    promise=MTP.create_promise(self.url,self.init_SchoolSearch,self.resolve,self.reject,self);
};
School.prototype.matches_school_names=function(name1,name2) {
    var replace_list=[{re:/Independent School District/,str:"ISD"},{re:/(Central|Consolidated) School District/,str:"CSD"}];
    var i;
    if(MTP.matches_names(name1,name2)) return true;
    for(i=0;i<replace_list.length;i++) {
        name1=name1.replace(replace_list[i].re,replace_list[i].str);
        name2=name2.replace(replace_list[i].re,replace_list[i].str);
        if(MTP.matches_names(name1,name2)) return true;
    }
    return false;
};

School.prototype.parse_bing_entry=function(b_algo,i,self) {
    var b_name,b_url,b_caption,p_caption;
    b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
    b_url=b_algo[i].getElementsByTagName("a")[0].href.replace(/\/Domain\/.*$/,"");
    b_caption=b_algo[i].getElementsByClassName("b_caption");
    p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0)?b_caption[0].getElementsByTagName("p")[0].innerText:"";
    if(self.query.debug) console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
    if((!MTP.is_bad_url(b_url,self.bad_urls,6,4)||/\/vnews\/display\.v\/SEC\//.test(b_url)) &&
       !self.is_bad_name(b_name,p_caption)) return {success:true,url:b_url,self:self};
    if(self.bing_school_closed(b_name,b_url,b_caption,p_caption)) return {success:false,closed:true,self:self};
    return {success:false};
};
School.prototype.bing_school_closed=function(b_name,b_url,b_caption,p_caption) {
    if(/\.publicschoolreview\.com/.test(b_url) && /\(Closed [\d]{4}\)/.test(b_name)) return true;
    return false;
};
School.prototype.parse_bing=function(doc,url,resolve,reject,self) {
    if(self.query.debug) console.log("in query_response\n"+url);
    var search, b_algo, i=0, inner_a,bad_urls=self.bad_urls;
    var b_url, b_name, b_factrow,lgb_info, b_caption,p_caption,entry_result;
    var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
    try {
        search=doc.getElementById("b_content");
        b_algo=search.getElementsByClassName("b_algo");
        lgb_info=doc.getElementById("lgb_info");
        b_context=doc.getElementById("b_context");
		if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
			console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
			if(parsed_lgb.phone) self.phone=parsed_lgb.phone;
		}
		
		
        for(i=0; i < b_algo.length&&i<1; i++) {
            entry_result=self.parse_bing_entry(b_algo,i,self);
            if(entry_result.success && (resolve(entry_result)||true)) return;
            else if(entry_result.closed && (reject(entry_result)||true)) return;
        }
        if(b1_success && (resolve({url:b_url,self:self})||true)) return;
        /* Do lgb only if everything else fails? */
        if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
            console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.url&&parsed_context.Title&&!(parsed_context.SubTitle && parsed_context.SubTitle==="County") &&
               self.matches_school_names(self.query.name,parsed_context.Title)
               &&!MTP.is_bad_url(parsed_context.url,self.bad_urls,6,3)) {
                if(b_algo.length>0 && (b_url=b_algo[i].querySelector("a").href) &&
                   b_url===parsed_context.url.replace(/^(https?:\/\/)([^\.]*)/,"$1www")) parsed_context.url=b_url;
                resolve({url:parsed_context.url,self:self})||true;
                return;
            }
        }
        if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info)) && parsed_lgb.url&&parsed_lgb.url.length>0 &&
           MTP.get_domain_only(window.location.href,true)!==MTP.get_domain_only(parsed_lgb.url,true)&&!MTP.is_bad_url(parsed_lgb.url,self.bad_urls,6,3)) {
			  
            if(self.query.debug) console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
            resolve({url:parsed_lgb.url,self:self});
            return;
        }

        for(i=1; i < b_algo.length&&i<6; i++) {
            entry_result=self.parse_bing_entry(b_algo,i,self);
            if(entry_result.success && (resolve(entry_result)||true)) return;
            else if(entry_result.closed && (reject(entry_result)||true)) return;
        }
        if(b1_success && (resolve({url:b_url,self:self})||true)) return;
    }
    catch(error) {
        reject(error);
        return;
    }
    if(parsed_lgb&&parsed_lgb.url&&parsed_lgb.url.length>0) resolve({url:parsed_lgb.url,self:self});
    else if(self.try_count++===0) {
        let promise=MTP.create_promise(self.get_bing_str(self.name+" "+(self.city||"")+" "+(reverse_state_map[self.state]||"")+" website"),
                                       self.parse_bing,resolve,reject,self);
    }
    else reject("No school website found for "+self.query.name+" in "+self.query.city+", "+self.query.state);
    //        GM_setValue("returnHit",true);
    return;

};
School.prototype.matches_title_regex=function(title) {
    //console.log("this.title_regex="+this.title_regex);
    for(var i=0; i < this.title_regex.length; i++) {
	//            console.log("this.title_regex["+i+"]="+this.title_regex[i]);
        if(title.match(this.title_regex[i])) return true; }
    return false;
};
School.prototype.matches_name=function(name) {
    //console.log("this.name="+this.name);
    var the_regex=/[\.\']+/g,dash_regex=/-/g,the_regex2=/ School$/;
    var short_school=this.name.replace(the_regex,"").replace(dash_regex," ").replace(the_regex2,"").toLowerCase().trim();
    var short_name=name.replace(the_regex,"").replace(dash_regex," ").replace(the_regex2,"").toLowerCase().trim();
    if(short_name.length===0) return false;
    if(short_name.indexOf(short_school)!==-1 || short_school.indexOf(short_name)!==-1) return true;
    if(MTP.matches_names(this.name,name)) return true;
    return false;
};
/* Schools.call_parser is a helper function to create a promise for the school parser */
School.prototype.call_parser=function(result) {
    var self=result.self,url=result.url,promise,promise_list=[],i;
    var done_count=0;
    console.log("url="+result.url+", base="+self.base);
    if(result.url_lst) {
        result.url_lst.sort();
        for(i=result.url_lst.length-1;i>=1;i--) {
            console.log("result.url_lst["+i+"]="+result.url_lst[i]+", result.url_lst["+(i-1)+"]="+result.url_lst[i-1]+",=="+
                        (result.url_lst[i]===result.url_lst[i-1]));
            if(result.url_lst[i].href===result.url_lst[i-1].href) result.url_lst.splice(i,1);
/*			if(result.url_list[i].href.replace(/^https?/,"")===result.url_lst[i-1].href.replace(/^https?/,"")) {
				result.url_lst.splice(i,1);
			}*/
        }
    }
    // console.log("self="+JSON.stringify(self));
    if(!result.url && result.url_lst) {
        for(i=0;i<result.url_lst.length;i++) {
            console.log("url_lst["+i+"].href="+result.url_lst[i].href);
            promise_list.push(MTP.create_promise(result.url_lst[i].href,self[self.page_type].parser,function(result) {
                console.log("!! Done "+(++done_count));
            }
						 ,MTP.my_catch_func,self));
        }
        console.log("Done pushing promises");
        Promise.all(promise_list).then(function() {
            console.log("#### done with url_lst promises");
			if(self.page_type==="blackboard" && self.contact_list.length===0) {
				console.log("Blackboard failed, trying parse none");
				promise=MTP.create_promise(self.base,self.parse_none,self.resolve,self.reject,self);
				return;
			}

            self.resolve(); }).catch(function(response) {
                console.log("FAiled url_lst something "+response);
                self.resolve(); });
        return;
    }
    else if(result.url && result.url!==self.base) promise=MTP.create_promise(result.url,self[self.page_type].parser,self.resolve,self.reject,self);
    else promise=MTP.create_promise(self.base,self.parse_none,self.resolve,self.reject,self);
};
School.prototype.find_base_blackboard=function(doc,url,resolve,reject,self) {
    var lst=doc.querySelectorAll(".schoollist a,ul[aria-label='Schools'] li a"),inner_a,i;
    var bad_regex=/(^\s*javascript|mailto)|((\.|\/)(facebook|youtube|twitter)\.com)/i;

    if(lst.length===0 && (lst=doc.querySelectorAll(".schools a")).length===0) lst=doc.querySelectorAll("a");
    var domain=MTP.get_domain_only(url,false);

    // console.log(domain+": in find_base_blackboard, lst.length="+lst.length);
    for(i=0;i<lst.length;i++) {
        lst[i].href=MTP.fix_remote_url(lst[i].href,url).replace(/\/$/,"");
        // console.log(domain+": lst["+i+"].innerText="+lst[i].innerText);
        if(self.matches_name(lst[i].innerText.trim()) && !bad_regex.test(lst[i].href)

          ) return MTP.fix_remote_url(lst[i].href,url);
    }
    //lst=doc.querySelectorAll("ul[aria-label='Schools'] li a");
    return url;
};
/* Schools.match_in_list matches the schools name in a list */
School.prototype.match_in_list=function(ul,url,self) {
    var i,children=ul.children,inner_a;
    for(i=0; i < children.length; i++) {
        console.log("children["+i+"].innerText="+children[i].innerText);
        if(self.matches_name(children[i].innerText) &&
           (inner_a=children[i].getElementsByTagName("a")).length>0) return MTurkScript.prototype.fix_remote_url(inner_a[0].href,url);
    }
    return null;

};
School.prototype.find_base_apptegy=function(doc,url,resolve,reject,self) {
    console.log("find_base_apptegy,url=",url,"doc=",doc);
    let temp_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1");
    var i,h4,cols=doc.getElementsByClassName("footer-col"),list,ret;
    for(i=0; i < cols.length; i++) {
        console.log("i=",i);l
        if((h4=cols[i].getElementsByTagName("h4")).length>0 && /Schools/i.test(h4[0].innerText)
           && (list=cols[i].getElementsByClassName("footer-links")).length>0 &&
           (ret= self.match_in_list(list[0],url,self))) return ret;
    }
    return url;
};
/* Generic find the directory location given some regexes to use */
School.prototype.find_dir=function(doc,url,resolve,reject,self) {
    var curr_type=self[self.page_type];
    var links=doc.links,i;
    var domain=MTP.get_domain_only(url);
    var good_links=[];

    for(i=0;i<links.length;i++) {
        links[i].href=MTP.fix_remote_url(links[i].href,url);
        if(MTP.get_domain_only(links[i].href)!==domain) continue;
        if(curr_type.href_rx.test(links[i].href) &&
           curr_type.text_rx.test(links[i].innerText.trim())) {
            console.log(domain+": resolving on "+links[i].innerText+",url="+links[i].href);
            good_links.push(new LinkQual(links[i].href,links[i].innerText));
            //    resolve({url:links[i].href,self:self}); return;
        }
    }
    if(good_links.length>0 && (resolve({url_lst:good_links,self:self})||true)) return;
    console.log(domain+": could not find, resolving on base "+url);
    resolve({url:url,self:self});
};

/* TODO: add priority for links */
School.prototype.find_dir_bb=function(doc,url,resolve,reject,extra) {
    var depth=0,self=extra.self?extra.self:extra;
    if(extra.bb_depth) depth=extra.bb_depth;
    var links=doc.links,i,scripts=doc.getElementsByTagName("script");
    var k;
    var domain=MTP.get_domain_only(url);
    var contact,new_url;
    if(self.bb_links===undefined) self.bb_links=[];

    var promise_list=[];
    var curr_type=self[self.page_type];
    console.log(domain+":curr_type="+JSON.stringify(curr_type)+", "+curr_type.text_rx);
    //  console.log(domain+"self="+JSON.stringify(self));
    for(i=0;i<links.length;i++) {
        links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
        //  console.log(domain+": links["+i+"].innerText="+links[i].innerText.trim());
        if(MTP.get_domain_only(links[i].href)!==domain) continue;
        //if() contact=links[i].href;
        if((/Contact Us|Staff Directory/.test(links[i].innerText)||curr_type.text_rx.test(links[i].innerText.trim()))
           && !/\.pdf$/.test(links[i].href)) {
            console.log(domain+": found good  "+links[i].innerText+",url="+links[i].href);
            let found_link=false;
            for(k=0;k<self.bb_links.length;k++) {
                //console.log("good_links["+k+"]="+good_links[k].href);
                if(links[i].href===self.bb_links[k].href) found_link=true; }
            if(!found_link) {
                console.log("Pushing "+links[i].href+", text="+links[i].innerText);
                self.bb_links.push(new LinkQual(links[i].href,links[i].innerText));
                if(depth===0) {
                    promise_list.push(
                        MTP.create_promise(links[i].href,self.find_dir_bb,MTP.my_then_func,MTP.my_catch_func,{self:self,bb_depth:depth+1}));
                }
		//    resolve({url:links[i].href,self:self}); return;
            }
        }
    }
    if(depth>0 && (resolve("")||true)) return;
    Promise.all(promise_list).then(function(result) {
        if(self.bb_links.length>0) {
            self.bb_links.sort(function(link1,link2) {
                return link2.quality-link1.quality; });
            console.log("self.bb_links="+JSON.stringify(self.bb_links));
            resolve({url_lst:self.bb_links,self:self}); return;
        }

        if((new_url=self.find_dir_bb_scripts(scripts,url,self))) {
            if(!/http/.test(new_url)) new_url=self.base+(/^\//.test(new_url)?"":"/")+new_url;
            console.log(domain+": resolving from scripts "+new_url);

            resolve({url:new_url,self:self}); }
        else if(contact) {
            console.log(domain+": resolving on contact "+contact);
            resolve({url:contact,self:self});
        }
        else {

            console.log(domain+": could not find, resolving on base "+url);
            resolve({url:url,self:self}); }
    });
};
/* Returns url if found in scripts, null otherwise */
School.prototype.find_dir_bb_scripts=function(scripts,url,self) {
    console.log("#find_dir_bb_scripts:");
    var i,j,match,icons_regex=/menuGlobalIcons\s*\=\s*([^;]+)/,parsed,x;
    var staff_regex2=/\"(?:Staff )?Directory\",\s*\"(\/[^\"]*)\"/;
    var poplinks_regex=/var popLinks\s+\=\s+(\[[^\]]*\])/,poplinks;
    for(i=0;i<scripts.length;i++) {
        //  console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
        if(match=scripts[i].innerHTML.match(icons_regex)) {
            parsed=JSON.parse(match[1]);
            for(j=0;j<parsed.length;j++) {
                if(parsed[j].length>=2 && /Directory/.test(parsed[j][0])) return parsed[j][1];
            }
        }
        else if(match=scripts[i].innerHTML.match(staff_regex2)) return match[1];
        else if(match=scripts[i].innerHTML.match(poplinks_regex)) {
            try {
                poplinks=JSON.parse(match[1]);
                // search the links for a good directory
                for(x of poplinks) {
                    if(/Directory/.test(x.text)) return x.url; }
            }
            catch(error) { console.log("error parsing poplinks json"); }
        }
    }
    return null;

};
School.prototype.parse_blackboard=function(doc,url,resolve,reject,self) {
    if(self.count===undefined) self.count=0;
    //console.log("doc.body.innerHTML="+doc.body.innerHTML);
    var staffdirectory=doc.querySelector(".staffdirectorydiv"),minibase=doc.querySelector(".minibase")
    var swdirectory=doc.querySelector(".sw-directory-item"),promise,footer=doc.querySelector(".gb-footer");
    var domain=MTP.get_domain_only(url),match;
    if(!footer && !(footer=doc.querySelector("#gb-footer"))) footer=doc.querySelector("footer");
    //console.log("footer.innerHTML="+footer.innerHTML);
    self.phone=self.find_phone(doc,url);
    if(self.phone && (match=self.phone.match(/^(?:\()?([\d]{3})/))) self.area_code=match[1];
    else self.area_code="";
    console.log("self.phone="+self.phone+", self.area_code="+self.area_code);
    if((staffdirectory||(staffdirectory=doc.querySelector(".cs-staffdirectorydiv"))) &&
       (self.staffdirectory=staffdirectory)) self.parse_bb_staffdirectory(doc,url,resolve,reject,self);
    else if(minibase && (self.minibase=minibase)) self.parse_bb_minibase(doc,url,resolve,reject,self);
    else if(swdirectory) self.parse_bb_swdirectory(doc,url,resolve,reject,self);
    else if(self.bb_depth===0) {
        console.log(domain+":Could not identify blackboard directory type "+url+",depth="+self.bb_depth);
        resolve(self);

        self.bb_depth++;

    }
    else {
        console.log(domain+":Could not identify blackboard directory type "+url);
        resolve(self);
        //self.parse_none(doc,url,resolve,reject,self);

    }
    // console.log("parse_blackboard, url="+url);
};
/* staffdirectoryresponsivediv (type1) */
School.prototype.parse_bb_staffdirectory=function(doc,url,resolve,reject,self) {
    var dir=self.staffdirectory;
    var inner_a=dir.querySelectorAll("a"),i,j;
    var domain=MTP.get_domain_only(url);
    var click_regex=/SearchButtonClick\(\'([^\']*)\',\s*([\d]*),\s*([\d]*),\s*([\d]*),\s*([\d]*)/,match;
    console.log("parse_bb_staffdirectory,url="+url);
    var promise_list=[],new_url,promise,url_begin,url_end;
    for(i=0;i<self.title_str.length;i++) {
        url_begin=self.url+"/site/default.aspx?PageType=2&PageModuleInstanceID="; //&ViewID=
        url_end="&RenderLoc=0&FlexDataID=0&Filter=JobTitle%3A"+encodeURIComponent(self.title_str[i]);
        for(j=0;j<inner_a.length;j++) {

            if((match=inner_a[j].outerHTML.match(click_regex))) {
                new_url=url_begin+match[5]+"&ViewID="+match[1]+url_end;
                promise=MTP.create_promise(new_url,self.parse_bb_staffdirectory_results,function(result) { console.log("Done results bbstaffdirectory"); }
                                           ,MTP.my_catch_func,self);
                break;
            }
        }
        if(promise===undefined) { console.log(domain+": Could not find SearchButtonClick and create promise"); }
        promise_list.push(promise);
    }
    Promise.all(promise_list).then(function() {
        console.log("Done all promises of bb_staffdirectory");

        resolve(self); });

};
    School.prototype.parse_bb_staffdirectory_results=function(doc,url,resolve,reject,self) {
        console.log("parse_bb_staffdirectory_result,url="+url);
        console.log("self=",self);
        console.log("doc=",doc);
        var cs="",staff,i,curr_contact,footer=doc.querySelector(".gb-footer"),staffemail,match;
        if(doc.querySelector(".cs-staffdirectorydiv")) cs="cs-";
        staff=doc.querySelectorAll("."+cs+"staff");
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        for(i=0;i<staff.length;i++) {
            curr_contact={name:staff[i].querySelector("."+cs+"staffname").innerText.trim(),
                          title:staff[i].querySelector("."+cs+"staffjob").dataset.value.trim(),url:url,
                          phone:staff[i].querySelector("."+cs+"staffphone").innerText.trim().replace(/\n/g,"").replace(/\s{2,}/g," ")
                         };
            if(curr_contact.phone.length>0 &&
               !phone_re.test(curr_contact.phone) && self.area_code.length>0) curr_contact.phone="("+self.area_code+") "+curr_contact.phone;
            else if(curr_contact.phone.length===0) curr_contact.phone=self.phone;
            staffemail=staff[i].querySelector(".staffemail script");
            if(staffemail&&(match=staffemail.innerHTML.match(/swrot13\(\'([^\']+)\'/))) {
                curr_contact.email=MTP.swrot13(match[1]);
            }
            //console.log("curr_contact="+JSON.stringify(curr_contact))
            if(self.matches_title_regex(curr_contact.title)) self.contact_list.push(curr_contact);
        }
        var pagination_list=doc.querySelector(".ui-pagination-list");
        if(!pagination_list) {

            resolve(self);
            return;
        }
        var current_page = pagination_list.querySelector(".ui-page-number-current");
        if(!current_page.nextElementSibling) {
            resolve(self);
        }
        else {
            console.log("current page has next sibling");
            console.log("current_page.nextElementSibling=",current_page.nextElementSibling);
            let begin_url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1")+"/cms/UserControls/ModuleView/ModuleViewRendererWrapper.aspx?";
            let inner_a = current_page.nextElementSibling.querySelector("a");
            console.log("inner_a=",inner_a.outerHTML+",inner_a.onclick=",inner_a.onclick);

            let inner_a_re=/PageChange\(([^\)]*)\)/;
            let inner_a_match = inner_a.outerHTML.match(inner_a_re);
            if(!inner_a_match) {
                console.warn("Failed inner_a_match");
                resolve(self);
                return;
            }
            let params=inner_a_match[1].split(/,\s*/);
            params = params.map((x) => x.replace(/\'/g,""));
            console.log("params=",params);

            begin_url=begin_url+"DomainID="+params[0]+"&PageID="+params[1]+"&ModuleInstanceID="+params[14]+"&PageModuleInstanceID="+params[11];
            begin_url=begin_url+"&Tag="+encodeURIComponent(params[10])+"&PageNumber="+params[13]+"&RenderLoc="+params[2]+"&FromRenderLoc="+params[3]+"&IsMoreExpandedView="+params[5];
            begin_url=begin_url+"&EnableQuirksMode="+params[4]+"&Filter="+encodeURIComponent(params[9])+"&ViewID="+params[12];
            console.log("begin_url=",begin_url);
            var promise=MTP.create_promise(begin_url,School.prototype.parse_bb_staffdirectory_results,resolve,reject,self);
//            resolve(self);
            return;
            //PageChange(0, 101109, 0, 0, 0, false, '', '0', '0','JobTitle:Grade','',125533,'d23c305b-e295-4186-9257-b05a61f233d9', 2,132687,'sw-module-1326870')

            //
           // https://www.dentonisd.org//cms/UserControls/ModuleView/ModuleViewRendererWrapper.aspx?DomainID=0&PageID=101109&ModuleInstanceID=132687&PageModuleInstanceID=125533&"
            //Tag=&PageNumber=2&RenderLoc=0&FromRenderLoc=0&IsMoreExpandedView=false&EnableQuirksMode=0&Filter=JobTitle%3AGrade&ScreenWidth=637&ViewID=d23c305b-e295-4186-9257-b05a61f233d9
        }
        //var pages=pagination_list.querySelectorAll(".ui-page-number");
        //var last_page = pages[pages.length-1];


    };
/* Probably best to just grab all the pages for a school since we don't know what we want */
School.prototype.parse_bb_minibase=function(doc,url,resolve,reject,self) {
    console.log("parse_bb_minibase,url="+url);
    self.page={}
    var minibase=self.minibase;
    var mod=minibase.parentNode,match,i,j,ModuleInstanceID=0,PageModuleInstanceID=0,ui_lbl,ui_dropdown;
    var detail=minibase.querySelector(".ui-widget-detail"),url_begin,url_end,new_url,field_num,ui_li,k;
    var filter="&FilterFields="+encodeURIComponent("comparetype:E:S;comparetype:E:S;"),promise;
    var flexitem=minibase.querySelectorAll(".sw-flex-item"),matched_school=false,matched_title=false;
    var inputs=minibase.querySelectorAll(".minibase table input");
    var promise_list=[];
    self.title_str=self.title_str.concat([""]);
    var fields=doc.querySelectorAll("[name^='Field']");
    var missing_field=-1;
    for(i=0;i<fields.length;i++) if((match=fields[i].id.match(/[\d]+$/)) && parseInt(match[0])>i && (missing_field=i)) break;
    if(match=mod.id.match(/[\d]+$/)) ModuleInstanceID=match[0];
    if(detail && (match=detail.id.match(/[\d]+$/))) PageModuleInstanceID=match[0];
    url_end="&DirectoryType=L&PageIndex=1";
    console.log("self.title_str="+self.title_str);
    for(k=0;k<self.title_str.length;k++) {
        filter="&FilterFields="+encodeURIComponent("comparetype:E:S;comparetype:E:S;");
        new_url=self.url+"/site/UserControls/Minibase/MinibaseListWrapper.aspx?ModuleInstanceID="+ModuleInstanceID;
        new_url=new_url+"&PageModuleInstanceID="+PageModuleInstanceID;
        for(i=0;i<flexitem.length;i++) {
            ui_lbl=flexitem[i].querySelector(".ui-lbl-inline");
            ui_dropdown=flexitem[i].querySelector("ul");
            if(!matched_school && /School/i.test(ui_lbl.innerText) && ui_dropdown && (ui_li=ui_dropdown.querySelectorAll("li"))) {

                field_num=ui_dropdown.id && ui_dropdown.id.match(/[\d]+$/) ? ui_dropdown.id.match(/[\d]+$/)[0] : i.toString();
                for(j=0;j<ui_li.length;j++) {
                    if(self.matches_name(ui_li[j].innerText) && (matched_school=true) &&
                       (filter=filter+encodeURIComponent(field_num+":C:"+ui_li[j].innerText.trim()+";"))) break;
                }
            }
            if(/Title|Position/i.test(ui_lbl.innerText) &&(matched_title=true)) {
                let textfield=flexitem[i].querySelector("input[type='text']"),j,field_pos=0,found_text=true;
                var selfield=flexitem[i].querySelector("ul[id^='sel-sw']"),sel_li,good_text;
                if(!textfield) {
                    found_text=false;
                    textfield=flexitem[i].querySelector("input"); }
                for(j=0;j<inputs.length;j++) {
                    if(inputs[j]===textfield) {
                        console.log("Found field at "+j);
                        field_pos=j;
                        break;
                    }
                }
                if(found_text||true) {
                    filter=filter+encodeURIComponent((field_pos).toString()+":C:"+self.title_str[k]+";");
                }
                /* else if(selfield) {
                   console.log("# Found selfield");
                   for(j=0;j<selfield.children.length;j++) {
                   if(self.title_str_regex&&self.title_str_regex.test(selfield.children[j].innerText.trim())) {
                   good_text=

                   }*/

            }
        }
        /* If a field was missing and there was no title field, hopefully that was the title field */
        if(!matched_title && missing_field>=0) filter=filter+encodeURIComponent((missing_field).toString()+":C:"+self.title_str[k]+";");
        new_url=new_url+filter+url_end;
        console.log("new_url="+decodeURIComponent(new_url)+", title_str="+self.title_str[k]);
        self.page[self.title_str[k]]=1;

        promise=MTP.create_promise(new_url,self.parse_bb_minibase_results,MTP.my_try_func,MTP.my_catch_func,{self:self,title_str:self.title_str[k]});
        promise_list.push(promise);
    }
    Promise.all(promise_list).then(function() {
        resolve(self);
    });

};
School.prototype.parse_bb_minibase_results=function(doc,url,resolve,reject,extra) {
    var title_str=extra.title_str,self=extra.self;
    var page=self.page[title_str];
    var curr_contact,lst=doc.querySelectorAll(".sw-flex-item-list"),i,j,label,items,x;
    var term_map={"first":/First/i,"last":/Last/i,"title":/^(Position|Title|Job)/i,"email":/^E(-)?mail/i,
                  "phone":/^(Phone|Tel)/i,"ext":/^(Ext)/i,"school":/School/i,"name":/Name/i,"department":/^(Department)/i};
    console.log("parse_bb_minibase_results,url="+url+", title_str="+title_str);
    for(i=0;i<lst.length;i++) {
        curr_contact={url:url};
        items=lst[i].querySelectorAll(".sw-flex-item");
        for(j=0;j<items.length;j++) {
            label=items[j].querySelector(".sw-flex-item-label").innerText;
            for(x in term_map) if(term_map[x].test(label.trim())) curr_contact[x]=items[j].innerText.replace(label,"").trim();
        }
        if(curr_contact.first && curr_contact.last) curr_contact.name=curr_contact.first+" "+curr_contact.last;
        if(!curr_contact.phone || curr_contact.phone.length===0) curr_contact.phone=self.phone;
        if(curr_contact.phone && curr_contact.phone.length>0 &&
           curr_contact.ext && curr_contact.ext.length>0) curr_contact.phone=curr_contact.phone+" x"+curr_contact.ext;
        console.log("curr_contact="+JSON.stringify(curr_contact));
        if(!curr_contact.title&&curr_contact.department) curr_contact.title=curr_contact.department;
        if(curr_contact.title && self.matches_title_regex(curr_contact.title)) self.contact_list.push(curr_contact);
    }
    resolve(self);
    // console.log("flexlist="+flexlist.innerHTML);
};

School.prototype.parse_bb_swdirectory=function(doc,url,resolve,reject,self) {
    console.log("parse_bb_swdirectory,url="+url+", resolving immediately for now");
      var items=doc.querySelectorAll(".sw-directory-item");
      var promise_list=[];
      var item;
      for(item of items) {
          item.href=MTP.fix_remote_url(item.href,url);
          promise_list.push(MTP.create_promise(item.href,School.prototype.parse_bb_swpage,function() { }, function() { }, self));
      }
      Promise.all(promise_list).then(function() { resolve("") }).catch(function() { reject(""); });
//    resolve("");
};
School.prototype.parse_bb_swpage=function(doc,url,resolve,reject,self) {
	console.log("parse_bb_swpage, url=",url,"doc=",doc);
	var name=doc.querySelector("#about-teacher-bio h1");
	var curr_contact={};
	var staffemail=doc.querySelector("[id^='emailLabel']");
	var staffphone=doc.querySelector("[id^='phoneLabel']");

	var match;
	if(name) curr_contact.name=name.innerText.trim();
	if(staffemail&&(match=staffemail.innerHTML.match(/swrot13\(\'([^\']+)\'/))) {
			curr_contact.email=MTP.swrot13(match[1]);
		}
	if(staffphone) curr_contact.phone=staffphone.innerText;
	if(curr_contact.name && curr_contact.email) {
		self.contact_list.push(curr_contact);
	}
	resolve("");
}

/* TODO: needs work other possible locations of staff directory exist */
School.prototype.find_dir_eschoolview=function(doc,url,resolve,reject,self) {
    if(self.count===undefined || typeof(self.count)==="object") self.count=0;
    console.log("in find_dir_eschoolview, url="+url+" ,count="+self.count);
	var staff="";
    var links=doc.links,i,promise;
    for(i=0;i<links.length;i++) {
        links[i].href=MTP.fix_remote_url(links[i].href,url);
        if(/Staff Directory/i.test(links[i].innerText)) {
            console.log("Resolving on "+links[i].href); resolve({url:links[i].href,self:self}); return; }
		if(/Staff/i.test(links[i].href)&&!staff) {
			staff=links[i].href;
		}
    }
    console.log("Done for");
	if(staff) {
		resolve({url:staff,self:self})
		return;
	}
    else if(self.count++===0 && (promise=MTP.create_promise(self.base+"/ContactUs.aspx",self.find_dir_eschoolview,resolve,reject,self))) return;
    else { console.log("Resolving on StaffDirectory.aspx"); resolve({url:self.base+"/StaffDirectory.aspx",self:self}); }

};
/* TODO: Have it choose the school to select */
School.prototype.parse_eschoolview=function(doc,url,resolve,reject,self) {
    console.log("in parse_eschoolview, url="+url);
    self.phone=self.find_phone(doc,url);
    console.log("self.phone="+self.phone);
    if(/The resource cannot be found|An Error/i.test(doc.title)) {
        let temp_promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);
        return;
    }

    var form=doc.querySelector("form"),query_url,scripts=doc.scripts,i,footer=doc.querySelector("footer");
    var inp=form.getElementsByTagName("input"),sel=form.getElementsByTagName("select"),match;
    var script_rx=/PageRequestManager\._initialize\('([^\']+)\'[^\[]*\[\'([^\']*)/,name_sel=form.querySelector("select");
    var data={},ops,data_str,promise,scriptm;
    if(self.try_count===undefined) self.try_count=0;
    var headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                 "Host": self.base.replace(/^https?:\/\/([^\/]*)\/.*$/,"$1").replace(/^\s*https?:\/\//,""),
                 "Origin": self.base.replace(/^(https?:\/\/[^\/]*)\/.*$/,"$1"),"Referer": url,"X-Requested-With": "XMLHttpRequest"};
    //console.log("headers="+JSON.stringify(headers));
    if(/GeneralError/.test(url) && self.try_count++===0) {
        promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);
        return; }
    query_url=MTP.fix_remote_url(form.action,url);
    //if(!footer) footer=doc.querySelector("#footerDiv");
    // if(footer && (match=footer.innerText.match(/Phone:\s*([\(\)-\s\d\/]+)/i))) self.phone=match[1].trim();
    //else self.phone="";
    ops=name_sel.options;
    for(i=0;i<scripts.length;i++) {
        if((match=scripts[i].innerHTML.match(script_rx)) && (scriptm=match[1]) && (data[scriptm]=match[2].replace(/^t/,""))) break;
    }
    for(i=0;i<inp.length;i++) {
        if(inp[i].type==="text" || inp[i].type==="hidden") data[inp[i].name]=inp[i].value;
        else if(inp[i].type==="submit" && /search/i.test(inp[i].value) &&
                (data[inp[i].name]=inp[i].value)) data[scriptm]=data[scriptm]+"|"+inp[i].name;
    }
    for(i=0;i<ops.length;i++) if(self.matches_name(ops[i].innerText)) data[name_sel.name]=ops[i].value;
    data.__ASYNCPOST=true;
    data_str=MTP.json_to_post(data).replace(/%20/g,"+");
    var x1;
    for(x1 in data) {
        console.log(x1+":"+data[x1]);
    }
    console.log("headers="+JSON.stringify(headers)+",query_url="+query_url);
    // console.log("data="+JSON.stringify(data));
    GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                       onload: function(response) {
                           console.log("response="+JSON.stringify(response));
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           self.parse_eschoolview_response(doc,response.finalUrl, resolve, reject,self); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
School.prototype.parse_eschoolview_response=function(doc,url,resolve, reject,self) {
    console.log("in parse_eschoolview_response, url="+url);
    var results=doc.querySelector(".results"),curr_contact;
    if(!results) {
        console.log(doc.body.innerHTML);
    }
    console.log("results.innerText="+results.innerText);
    var main_div=results.parentNode.nextElementSibling;
    //console.log("main_div.innerHTML="+main_div.innerHTML);
    var spans=main_div.children,i;
    for(i=0;i<spans.length;i++) {
        //console.log("spans["+i+"].innerHTML="+spans[i].innerHTML);
        curr_contact={name:spans[i].querySelector(".scName")?Gov.parse_name_func(spans[i].querySelector(".scName").innerText.trim()):"",
                      title:spans[i].querySelector(".scTitle")?spans[i].querySelector(".scTitle").innerText.trim():"",
                      phone:spans[i].querySelector(".scPhone")&&spans[i].querySelector(".scPhone").innerText.length>0
                      ?spans[i].querySelector(".scPhone").innerText.trim():self.phone,url:url,
                      email:spans[i].querySelector(".scEmail")?spans[i].querySelector(".scEmail").innerText.trim():""};
	if(!/@/.test(curr_contact.email)) curr_contact.email="";
        if(curr_contact.title && self.matches_title_regex(curr_contact.title)) self.contact_list.push(curr_contact);
    }
    if(spans.length===0) { console.log("doc.body.innerHTML="+doc.body.innerHTML); }
    resolve(self);
};

School.prototype.find_base_echalk=function(doc,url,resolve,reject,self) {
    console.log("find_base_echalk,url="+url);
    var scripts=doc.scripts,curr,match;
    var schools_re=/var schools\s+\=\s+(\[.*\]);/,school_lst,curr_sch;
    for(curr of scripts) {
        if((match=curr.innerHTML.match(schools_re))) {
            try {
                school_lst=JSON.parse(match[1]);
                for(curr_sch of school_lst) {
                    if(self.matches_name(curr_sch.name)) return "http://"+curr_sch.sitePrimaryDomainName;
                }
            }
            catch(error) { console.log("error parsing JSON, find_base_echalk"); }
        }
    }
    return url.replace(/\/directory\/school.*$/,"");
};

School.prototype.parse_echalk=function(doc,url,resolve,reject,self) {
    var scripts=doc.scripts,curr,match;
    var profiles_re=/var profiles\s+\=\s+(\[.*\]);/,profiles_lst,curr_prof,curr_contact;
    for(curr of scripts) {
        if((match=curr.innerHTML.match(profiles_re))) {
            try {
                profiles_lst=JSON.parse(match[1]);
                for(curr_prof of profiles_lst) {
                    //  console.log("curr_prof="+JSON.stringify(curr_prof));
                    curr_contact={url:url,name:"",email:""};
                    if(curr_prof.user) {
                        curr_contact.name=(curr_prof.user.nameFirst?curr_prof.user.nameFirst:"");
                        if(curr_prof.user.nameMiddle) curr_contact.name=curr_contact.name+" "+curr_prof.user.nameMiddle;
                        if(curr_prof.user.nameLast) curr_contact.name=curr_contact.name+" "+curr_prof.user.nameLast;
                    }
                    curr_contact.title=curr_prof.position||"";
                    /* TODO: deal with phone later when needed */
                    if(curr_prof.identity) {
                        curr_contact.email=curr_prof.identity.email||"na"; }
                    // console.log("curr_contact="+JSON.stringify(curr_contact));
                    if(self.matches_title_regex(curr_contact.title)) self.contact_list.push(curr_contact);
                }
            }
            catch(error) { console.log("error parsing JSON, find_base_echalk"); }
        }
    }
    resolve(self);
};


/* Find base url for school for schoolmessenger */
School.prototype.find_base_schoolmessenger=function(doc,url,resolve,reject,self) {
    console.log("find_base_schoolmessenger,url="+url);
    var sch,lst=doc.querySelectorAll(".schoolDropdown .schoolList li a");
    for(sch of lst) {
        if(self.matches_name(sch.innerText.trim())) return sch.href;
    }
    return url;
};


School.prototype.parse_schoolmessenger=function(doc,url,resolve,reject,self) {
    self.do_west_react(doc,url,resolve,reject,self);
}

/**
 * '''do_west_react''' does the react-based West Corporation queries
 * doc is the parsed document from the GM_xmlhttprequest response.responseText,
 * finalUrl is response.finalUrl from same query
 */
School.prototype.do_west_react=function(doc,url,resolve,reject,self) {
    console.log("do_west_react,url="+url);
    var appendElement=document.body;
    self.westSearchTerm="";//self.query.title_str;
    url=url.replace(/^(https?:\/\/[^\/]+).*$/,"$1");
    //console.log("do_west_react,now url="+url)
    self.westBaseUrl=url;

    function increment_scripts() {
        ++self["loadedWestScripts"+url];
        console.log(url+": Loaded "+(self["loadedWestScripts"+url])+" out of "+self.totalWestScripts+" total scripts");
        if(self["loadedWestScripts"+url]===self.totalWestScripts) self.loadWestSettings(doc,url,resolve,reject,self);
    }

    var scripts=doc.scripts,i,div=document.createElement("div"),script_list=[],curr_script;
    try {
        self.portletInstanceId=doc.getElementsByClassName("staffDirectoryComponent")[0].dataset.portletInstanceId;
    }
    catch(error) {
        console.log("Error with West "+error);
        var promise=MTP.create_promise(self.base,self.parse_none,resolve,reject,self);
        return;
    }
    if(appendElement!==undefined) appendElement.appendChild(doc.getElementsByClassName("staffDirectoryComponent")[0]);
    var good_scripts=doc.querySelectorAll("script[id*='ctl']"), head=document.getElementsByTagName("head")[0];
    self.totalWestScripts=good_scripts.length;
    self["loadedWestScripts"+url]=0;
    for(i=0; i<good_scripts.length; i++) {
        (curr_script=document.createElement("script")).src=good_scripts[i].src.replace(/^http:/,"https:");
        curr_script.onload=increment_scripts;
        script_list.push(curr_script);
        head.appendChild(curr_script);
    }
};
/* Loads the settings, namely the groupIds which is all we need */
School.prototype.loadWestSettings=function(doc,url,resolve,reject,self) {
    console.log("loadWestSettings, url="+url);
    var json={"portletInstanceId":this.portletInstanceId};
    this.loadWestReact(doc,url,function(response) {
        var r_json=JSON.parse(response.responseText),i;
        self.westGroupIds=[];
        for(i=0; i < r_json.d.groups.length; i++) self.westGroupIds.push(r_json.d.groups[i].groupID);
        self.loadWestSearch(doc,url,resolve,reject,self);
    },reject,{type:"Settings",json:json,self:this});
}
/**
 * '''loadWestSearch''' loads the West Corporation style search query for the job title set by
 * my_query.job_title r loads the first 9999 alphabetically otherwise if my_query.job_title isn't set
 *
 * Letting json_response=JSON.parse(response.responseText), json_response.d.results should have a
 * list of objects of the results to the query, with
 * fields email, firstName, lastName,jobTitle,phone,website,imageURL,userID
 *
 *
 */
School.prototype.loadWestSearch=function(doc,url,resolve,reject,self) {
    var json={"firstRecord":0,"groupIds":self.westGroupIds,"lastRecord":9999,
              "portletInstanceId":self.portletInstanceId,
              "searchTerm":self.westSearchTerm,"sortOrder":"LastName,FirstName ASC","searchByJobTitle":true};
    if(self.westSearchTerm===undefined) { json.searchTerm=""; json.searchByJobTitle=false; }
    self.loadWestReact(doc,url,resolve,reject,{type:"Search",json:json,self:self});
};
/**
 * '''loadWestReact''' does a GM_xmlhttprequest query of the StaffDirectory at the my_query.staff_path in question
 *
 * (my_query.staff_path to be found by searching e.g. Bing, and should be the part found by /https?:\/\/[^\/]+/
 * type is the type of query to get ("Settings" or "Search"), url is the what's the fucking word for beginning of path
 * url of the website
 * json is the json to send with it since it's a POST request
 * callback is the callback
 */
School.prototype.loadWestReact=function(doc,old_url,resolve,reject,extra) {
    var type=extra.type,json=extra.json,self=extra.self;
    console.log("loadWestReact, url="+old_url+", type="+JSON.stringify(type)+", extra="+JSON.stringify(extra.json));

    var url=self.westBaseUrl+"/Common/controls/StaffDirectory/ws/StaffDirectoryWS.asmx/"+type;

    var headers={"Content-Type":"application/json;charset=UTF-8"};
    GM_xmlhttpRequest({method: 'POST', url: url, headers:headers, data:JSON.stringify(json),
		       onload: function(response) {
			   if(type==="Search") { self.parseWestSearch(response,resolve,reject,self); }
			   else if(type==="Settings"||true) { resolve(response); }
		       },
		       onerror: function(response) { console.log("Fail"); },
		       ontimeout: function(response) { console.log("Fail"); }
		      });
};
/**
 * parse_west_search is called after the initial search query with the response,
 * searches to see if there are any private emails, then grabs them
 * with another loophole
 */
    School.prototype.parseWestSearch=function(response,resolve,reject,self) {
    var search=JSON.parse(response.responseText);
    var results=search.d.results,i,url,promise_list=[];
    Object.assign(self,{westResults:results,westPrivateCount:0,westPrivateDone:0});
    for(i=0; i < results.length; i++) {
        console.log("("+i+"), "+JSON.stringify(results[i]));
        if(results[i].email==="private") {
            self.westPrivateCount++;
            url=self.westBaseUrl+"/common/controls/General/Email/Default.aspx?action=staffDirectoryEmail&"+
                "recipients="+results[i].userID;
            console.log("private email url="+url);
            if(results[i].jobTitle && self.matches_title_regex(results[i].jobTitle)) {
                promise_list.push(MTP.create_promise(url,self.getWestPrivateEmail,MTP.my_try_func,MTP.my_catch_func,{i:i,self:self}));
            }
            else {
                results[i].url=self.westBaseUrl;
            }
        }
        // else console.log("results["+i+"].email="+results[i].email);
	//            console.log("Email for "+i+"="+results[i].email);
    }
    Promise.all(promise_list).then(function() {

        for(var i=0;i<self.westResults.length;i++) {
            let curr=self.westResults[i];
            self.contact_list.push({email:curr.email?curr.email:"",title:curr.jobTitle?curr.jobTitle:"",
                                    phone:curr.phone?curr.phone:"",name:curr.firstName && curr.lastName?curr.firstName+" "+curr.lastName:""
                                    ,url:curr.url?curr.url:self.westBaseUrl});
        }
        console.log("Done with private emails");
        resolve(self);
    }).catch(function() {
         for(var i=0;i<self.westResults.length;i++) {
            let curr=self.westResults[i];
            self.contact_list.push({email:curr.email?curr.email:"",title:curr.jobTitle?curr.jobTitle:"",
                                    phone:curr.phone?curr.phone:"",name:curr.firstName && curr.lastName?curr.firstName+" "+curr.lastName:""
                                    ,url:curr.url?curr.url:self.westBaseUrl});
        }
        resolve(self); });
    //console.log("search="+text);
};
/**
 * getWestPrivateEmail uses another avenue to find the emails they tried to keep private
 * it resolves on the original callback to the West thing once all the private emails have been grabbed
 * probably a clunky way to do it but it's working and should be self contained
 */
School.prototype.getWestPrivateEmail=function(doc,url,resolve,reject,extra) {
    var i=extra.i,self=extra.self;
    console.log("url="+url);
    var headers={"Content-Type":"application/json;charset=UTF-8"};
	self.westResults[i].email=doc.getElementById("ctl00_ContentPlaceHolder1_ctl00_txtTo")?doc.getElementById("ctl00_ContentPlaceHolder1_ctl00_txtTo").value:"";
	self.westResults[i].url=url;
	self.westPrivateDone++;
    console.log("Done "+self.westPrivateDone+" private emails");
    resolve(i);
};
School.prototype.init_SchoolSearch=function(doc,url,resolve,reject,self) {
    var refresh=Gov.needs_refresh(doc,url),temp_promise;
    if(refresh && (temp_promise=MTP.create_promise(refresh,self.init_SchoolSearch,resolve,reject,self)||1)) return;
    var curr_school,promise,parse_url;
    self.base=url.replace(/\/$/,"")
    self.url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1");
    self.bb_depth=0;
    self.resolve=resolve;self.reject=reject;
    self.page_type=self.id_page_type(doc,url,resolve,reject,self);
    if(self.page_map[self.page_type]!==undefined) self.page_type=self.page_map[self.page_type];
    // Schools.curr_school=Schools[Schools.page_type];

    /*console.log("School.prototype.init_SchoolSearch, url="+url+", query="+JSON.stringify(self.query));
      console.log("page_type="+self.page_type);*/
    console.log("|"+self.query.name+"|"+url+"|"+self.query.street+"|"+self.query.city+"|"+self.query.state+"|"+self.page_type);
    //return;
    /* Base is the base page for a school if we're in a district/system page */
    if((curr_school=self[self.page_type])&&curr_school.find_base&&self.type==="school") {
        console.log("searching for base "+JSON.stringify(self[self.page_type]));
        self.base=curr_school.find_base(doc,url+(curr_school.base_suffix?curr_school.base_suffix:""),resolve,reject,self).replace(/\/$/,""); }
    console.log("self.base="+self.base);

    /* if suffix we can immediately head to the directory parser */
    if(curr_school && curr_school.suffix) {
        console.log("# heading immediately to directory");
        self.call_parser({url:self.base+curr_school.suffix,self:self}); 
	
		
		}
    else if(curr_school && curr_school.find_directory) {
        console.log(self.name+": Finding directory");
        promise=MTP.create_promise(self.base,curr_school.find_directory,self.call_parser,MTP.my_catch_func,self);
    }
    else if(!curr_school) {
        console.log("School page_type not defined parsing yet, trying parse_none");
        self.parse_none(doc,url,resolve,reject,self);
    }
    else {
        console.log("Weird shouldn't be here");
        for(var x in curr_school) {
            console.log("curr_school["+x+"]="+curr_school[x]); }
    }
};

/**Schools.id_page_type identifies the CMS/etc for the school website */
School.prototype.id_page_type=function(doc,url,resolve,reject,self) {
    var page_type="none",i,j,match,copyright,sites_google_found=false,generator="",gen_content,gen_list=doc.querySelectorAll("meta[name='generator' i]");
    var page_type_regex2=/Apptegy/,copyright_regex=/Blackboard, Inc/,page_type_regex=new RegExp(self.page_regex_str,"i");
    for(i=0; i < gen_list.length; i++) {
        if(gen_list[i].content) { generator+=(generator.length>0?";":"")+gen_list[i].content.replace(/ - [^;]*/g,""); }
    }
    //console.log("generator="+(generator[i].content));
    var lst=[doc.links,doc.querySelectorAll("link")];
    for(j=0;j<lst.length;j++) {
        for(i=0; i < lst[j].length; i++) {

            lst[j][i].href=MTP.fix_remote_url(lst[j][i].href,url);
            // console.log("lst["+j+"]["+i+"].href="+lst[j][i].href+", text="+lst[j][i].innerText);
            if((match=lst[j][i].href.match(page_type_regex)) || (match=lst[j][i].innerText.match(page_type_regex2))) {
                page_type=match[0].replace(/\.[^\.]*$/,"").toLowerCase().replace(/www\./,"").replace(/\./g,"_").replace(/^\/\//,"");
                break; }
            else if(/sites\.google\.com/.test(lst[j][i].href) && /Google Sites/i.test(lst[j][i].innerText)) sites_google_found=true;
            else if(generator.length===0 && MTP.get_domain_only(url,true)===MTP.get_domain_only(lst[j][i].href,true) &&
                    /\/wp-content|wp\//.test(lst[j][i].href)) generator="WordPress";
            else if(/\/CMSScripts\//.test(lst[j][i].href)) generator="Kentico";
        }
    }
    doc.querySelectorAll("footer").forEach(function(footer) {
        if(footer.dataset.createSiteUrl&&/sites\.google\.com/.test(footer.dataset.createSiteUrl)) sites_google_found=true; });
    if(page_type==="none" && doc.getElementById("sw-footer-copyright")) page_type="blackboard";
    else if(page_type==="none"&& sites_google_found) page_type="sites_google";
    if(page_type==="none") {
        doc.querySelectorAll("script").forEach(function(curr_script) {
            for(i=0; i < self.script_regex_lst.length;i++) {
                if(curr_script.src&&self.script_regex_lst[i].regex.test(curr_script.src)) page_type=self.script_regex_lst[i].name;
                //  else if(curr_script.innerHTML.indexOf("_W.configDomain = \"www.weebly.com\"")!==-1) console.log("generator=weebly.com");
            }
        });
    }
    if(page_type==="none" && generator.length>0) return self.fix_generator(generator);
    return page_type;
};
