
//var my_query = {};
//var MTP=MTurkScript.prototype;
/* Gov.script_loaded is a map of urls to number loaded there, script total is a map of urls to total number needed there */
var Gov=Gov||{contact_list:[],scripts_loaded:{},scripts_total:{},area_code:"",
	      split_lines_regex:/\s*\n\s*|\s*\t\s*|–|(\s*-\s+)|\||                     |	|	|●|•|\s{3,}|\s+[*≈]+\s+/,
	      id_map:{"ahaconsulting":"municodeweb","seamlessgov":"seamlessdocs","townwebdesign":"townweb","civicasoft":"granicus"},
	      title_regex:new RegExp("(^|[\\s,\\.]{1})(Clerk-Treasurer|Officer|Head of School|Director|Department|Supervisor|Manager|Clerk|Administrator|Inspector|Assistant|"+
				     "Council Member|Attorney|Recorder|Official|Coordinator|Mayor|Planner|Engineer|Police|Fire|Specialist|"+
				     "Superintendent|Marshal|Public|Clerk|Code Enforcement|Building Services|Operations|Sgt\.|Det\.|"+
				     "Foreman|Secretary|Chief|President)($|[\\/\\n\\s,\\. ]{1}|[^A-Za-z0-9]{1})$","i"),
	      title_prefix_regex:/^(Director|Mayor|Chief|Councilman|Councilwoman|Secretary|Sergeant|Patrol Officer|Lieutenant|Detective)\s+/,
	      bad_stuff_re:/(\/\*)|(^Wh.*\?$)|(\sand\s)|([\d]+)|(I want to\s.*$)|(^Home.*)|(…)|((City|Town) Hall)|City Hall|Welcome to/i
	      ,bad_stuff_re2:/(Contact( Us)?)$|Navigation|Email|Search|Economic|Quick Links|Choose |function\(|var |\/.*\//i, //Menu([^A-Za-z0-9]|$)
	      bad_link_regex:/(^\s*(javascript|mailto|tel):)|(\/(cdn-cgi|tag|event|events)\/)|(\/#email)|(#$)|(\/login)|(\/events)|(-schedule(-|\/))|(\.pdf$)/i,
	      bad_contact_regex:/Webmaster|Employee Email|(^|\s)Login|Email Notifications|Business .*Directory|(State|Federal).*Contacts/i,
	      dept_name_regex:/^(Department of )?(Parks (and|&) Recreation|Library|CPED|Public Works|Police|Sanitation|Administration|Parks|Recreation|Information Technology|Human Resources|Civil Rights)\s*(Department)?$/i,

	      contact_regex:/Contact|Email|Directory|(^About)|(^Departments)|Staff|Officials|^(Town|City) Hall\s*$|(^Government)|(Our Team)|(Personnel)/i};
Gov.bad_out_link_regex=/(\/|\.)(facebook|twitter|youtube|constantcontact|activecommunities)\.com|(coderedweb\.net)|(chamber-of-commerce)|(youtu.be)/i;
Gov.scrapers={"ahaconsulting":null,"alphadogsolutions":null,"blackboard":null,"civicasoft":null,"civiclive":null,"civicplus":null,"combusser":null,
	      "egovlink":null,
	      "edlio":null, "egovstrategies":null,"evogov":null,"govfresh":null,"govoffice":null,"govsites":null,"granicus":null,"igovwebsites":null,
	      "infomedia":null,"localgovcorp":null,"municodeweb":null,"municipalcms":null,"municipalimpact":null,"municipalwebservices":null,
	      "muniweb":null,
	      "none":null,
	      "qscend":null,"revize":null,
	      "sophicity":null,"townweb":null,"townwebdesign":null,"visioninternet":null,"vt-s":null};
//"govoffice":Gov.scrape_govoffice,
Gov.muni_regex_str="((City)|(Town)|(Boro(ugh)?)|(County)|(Village)|(Municipal))";
Gov.manager_regex_str="((Manager)|(Administrator)|(Supervisor))";
Gov.title_regex_map={"city manager":new RegExp(Gov.muni_regex_str+"\\s+"+Gov.manager_regex_str)};
//var MTurk=new MTurkScript(20000,200,[],init_Query,"[TODO]");

/* Check if a title matches a department regex */
Gov.matches_dept_regex=function(title) {
    for(var i=0; i < Gov.query.dept_regex_lst.length; i++) if(title.match(Gov.query.dept_regex_lst[i])) return true;
    return false;
};
/* Check if a title matches a person title regex */
Gov.matches_title_regex=function(title) {
    for(var i=0; i < Gov.query.title_regex_lst.length; i++) if(title.match(Gov.query.title_regex_lst[i])) return true;
    return false;
};

Gov.find_phone=function(doc,url) {
    var schoolphone,phone,match;
    var phone_re_str_begin="(?:Tel|Telephone|Phone|Ph|P|T):\\s*";
    var phone_re_str_end="([(]?[0-9]{3}[)]?[-\\s\\.\\/]+[0-9]{3}[-\\s\\.\\/]+[0-9]{4,6}(\\s*(x|ext\\.?)\\s*[\\d]{1,5})?)";
    var ext_phone_re=new RegExp(phone_re_str_begin+phone_re_str_end,"i");
    if((schoolphone=doc.querySelector("a[href^='tel:']"))) phone=schoolphone.innerText.trim();
    else if(!phone && (match=doc.body.innerHTML.match(ext_phone_re))) phone=match[1];
    // else if((match=doc.body.innerHTML.match(phone_re))) console.log("phone alone match="+match);
    console.log("Phone="+phone);
    return phone;
};


/** Gov.scrape_none scrapes a generic government website for employees */
Gov.scrape_none=function(doc,url,resolve,reject) {

    console.log("In Gov.scrape_none");
    Gov.get_contact_links(doc,url,resolve,reject);
    var temp_phone;
    var promise_list=[],i;
    if((temp_phone=Gov.find_phone(doc,url))) Gov.phone=temp_phone;
    else Gov.phone="";
   
    /* Load the front page too happens once in a while */
    Gov.contact_links.push({url:url,name:"Home"});
    
    for(i=0; i < Gov.contact_links.length; i++) {

	/* First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
	   though you may need to load other scripts too, then parse them */
	console.log("CONTACTY WONTACTY");
	promise_list.push(MTurkScript.prototype.create_promise(
	    Gov.contact_links[i].url,Gov.load_scripts,Gov.parse_contacts_then));
    }

    if(Gov.dept_page.length>0) {
	//Gov.dept_links=[];
	console.log("GRABBY GABBY Gov.dept_page="+Gov.dept_page);
	promise_list.push(MTP.create_promise(Gov.dept_page,Gov.grab_department_pages,MTP.my_then_func,MTP.my_catch_func));
    }
    else {
	for(i=0; i < Gov.dept_links.length; i++) {
	    promise_list.push(MTurkScript.prototype.create_promise(Gov.dept_links[i].url,Gov.parse_department,MTurkScript.prototype.my_then_func,
								   MTurkScript.prototype.my_catch_func,Gov.dept_links[i])); }
    }
    console.log("scrape_none: promise_list.length="+promise_list.length);
    Promise.all(promise_list).then(function(response) {
	console.log("Finished scrape_none promises "+response);
	resolve("MOOOOOOOOOOOO "+response); })
	.catch(function(response) {
	console.log("Error scrape_none promises "+response);
	    resolve("MOOOOOOOOOOOO "+response); });
};
Gov.grab_department_pages=function(doc,url,resolve,reject) {
    console.log("## in Gov.grab_department_pages, url="+url);
    var links=doc.links,promise_list=[],i;
    var bad_link_regex=/(^\s*(javascript|mailto|tel):)|(\/(cdn-cgi|tag)\/)|(\/#email)/i;
    for(i=0;i<links.length;i++) {
	links[i].href=MTP.fix_remote_url(links[i].href,url);
	if(Gov.matches_dept_regex(links[i].innerText) && !Gov.bad_out_link_regex.test(links[i].href) &&
	   !Gov.includes_link(Gov.dept_links,{url:links[i].href,name:links[i].innerText}) &&
	   !Gov.bad_link_regex.test(links[i].href)) Gov.dept_links.push({url:doc.links[i].href,name:doc.links[i].innerText});
    }
    console.log("Gov.dept_links.length="+Gov.dept_links.length);
    for(i=0; i < Gov.dept_links.length; i++)
    {
	//console.log("i="+i+", Gov.dept_links[i]="+Gov.dept_links[i]);
	/* First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
	   though you may need to load other scripts too, then parse them */

	promise_list.push(MTurkScript.prototype.create_promise(
	    Gov.dept_links[i].url,Gov.parse_department,Gov.parse_contacts_then,MTurkScript.prototype.my_catch_func,Gov.dept_links[i]));
    }
    Promise.all(promise_list).then(function(response) {
	console.log("! Done Gov.grab_department_pages"); resolve(response); })
	.catch(function(response) {
	console.log("Error grab_department_pages promises "+response);
	    resolve("MOOOOOOOOOOOO "+response); });
	      
};

/** Gov.parse_department parses a specific department page
 * TODO: a specific page that parses a page listing the departments
 **/
Gov.parse_department=function(doc,url,resolve,reject,dept) {
    var add_count,name=dept.name;
    console.log("@@@ name="+name);
    console.log("In Gov.parse_department at "+url);
    Gov.get_department_contact_links(doc,url,resolve,reject,name);

    var external_promise;
    var promise_list=[],i;
    promise_list.push(MTP.create_promise(url,Gov.load_scripts,MTP.my_then_func,MTP.my_catch_func,name));

    if(Gov.depts[name].external_links.length>0 && !Gov.depts[name].external_parsed) {

	Gov.depts[name].external_parsed=true;
	console.log("HONKY KONG");
	external_promise=MTurkScript.prototype.create_promise(Gov.depts[name].external_links[0],Gov.parse_department,Gov.parse_contacts_then,MTurkScript.prototype.my_catch_func,name);
	promise_list.push(external_promise);

    }
    else {
	for(i=0; i < Gov.depts[name].contact_links.length; i++)
	{
	    console.log("i="+i+", Gov.depts["+name+"].contact_links="+Gov.depts[name].contact_links[i].url);
	    // First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
	    //  though you may need to load other scripts too, then parse them
	    promise_list.push(MTurkScript.prototype.create_promise(
		Gov.depts[name].contact_links[i].url,Gov.load_scripts,Gov.parse_contacts_then,MTurkScript.prototype.my_catch_func,name));
	}
    }
    Promise.all(promise_list).then(function(response) { resolve("Done department "+name+" "+(add_count?add_count:"")+", response="+response); });
};

/** Gov.load_scripts loads all the tables in a document into a special non-displayed div at the end of the current document  */
Gov.load_scripts=function(doc,url,resolve,reject,dept_name) {
    if(typeof(dept_name)==="object") { dept_name=""; }
    console.log("load scripts: "+url+", Department="+dept_name);
    var scripts_to_load=[],i,j,scripts=doc.scripts,curr_script,script_list=[];
    var temp_div=document.createElement("div"),head=document.head;
    temp_div.id="temp_div_id";
    temp_div.style.display="none";
    document.body.appendChild(temp_div);
    var tables=doc.querySelectorAll("table");
    for(i=0; i < tables.length; i++)
    {
	let temp_table_scripts=tables[i].getElementsByTagName("script");
	let imgs=tables[i].getElementsByTagName("img"); /* Don't care about images */
	for(j=0;j<imgs.length;j++) imgs[j].src="";
	for(j=0; j < temp_table_scripts.length; j++) {
	    //console.log("temp_table_scripts["+j+"]="+temp_table_scripts[j].outerHTML);
	    /* Only loading scripts from the current site */
	    if(temp_table_scripts[j].src===undefined || temp_table_scripts[j].src.length===0 ||
	       MTP.get_domain_only(temp_table_scripts[j].src,true)===MTP.get_domain_only(url,true)) { scripts_to_load.push(temp_table_scripts[j]); }
	}
	try {
	    temp_div.appendChild(tables[i].cloneNode(true));
	}
	catch(error) { console.log("error appending child table thing="+error); }
    }
    // scripts_to_load=scripts;

    /* Internal function to increment the number of scripts loaded and once all are loaded, parse the tables */
    function increment_scripts()
    {
	var k;
	Gov.scripts_loaded[url]++;
	//console.log("Gov.scripts_loaded["+url+"]="+Gov.scripts_loaded[url]);
	if((Gov.scripts_loaded[url])>=Gov.scripts_total[url]) {
	    // console.log("LOOOOOOAD "+url+", dept_name="+dept_name);
	    for(k=0;k<script_list.length;k++) {
		script_list[k].innerHTML=script_list[k].innerHTML.replace(/document\./,"document.querySelector(\"#temp_div_id\").");
	    }
	    setTimeout(function() {
		MTP.fix_emails(doc,url);
		Gov.parse_contact_tables(doc,url,resolve,reject,temp_div,dept_name); }, 100);
	    return true;
	}

	return false;
    }

    Gov.scripts_loaded[url]=0;
    if((Gov.scripts_total[url]=scripts_to_load.length)===0) {
	Gov.parse_contact_tables(doc,url,resolve,reject,temp_div,dept_name);
	return true; }

    console.log(url+": scripts_to_load.length="+scripts_to_load.length);
    for(i=0; i < scripts_to_load.length; i++)
    {
	// console.log("url="+url+", curr_script="+scripts_to_load[i].outerHTML);
	curr_script=document.createElement("script");
	if(scripts_to_load[i] && (scripts_to_load[i].src===undefined || scripts_to_load[i].src.length===0))
	{
	    /*  curr_script.innerHTML=scripts_to_load[i].innerHTML.replace(/document\.write\([^\)]*\);/g,"").replace(/document\.write\([^;]*;/g,"")
		.replace(/document\./g,"document.querySelector(\"#temp_div_id\").");*/
	    if(increment_scripts()) return true;
	}
	else if(scripts_to_load[i]) {
	    curr_script.src=MTP.fix_remote_url(scripts_to_load[i].src,url);
	    //    console.log("curr_script.src="+curr_script.src);
	}
	else { console.log("Weird state");
	       increment_scripts();
	       continue; }
	curr_script.onload=increment_scripts;
	script_list.push(curr_script);
	//  console.log(url+": "+curr_script.outerHTML);
	try {

	    temp_div.appendChild(curr_script);
	}
	catch(error) { console.log("script load error="+error); }


    }
    console.log("script_list.length="+script_list.length);
};

/* Gov.get_area_code tries to find a (for now US) area code in the page.
 * would probably be better to have as general MTurkScript */
Gov.get_area_code=function(doc) {
    var area_code_regex=/\((\d{3})(?:\s*area code)?/,area_code_match;
    if(area_code_match=doc.body.innerHTML.match(area_code_regex)) return "("+area_code_match[1]+")";
    else return "";
};

/** Gov.parse_contact_tables parses all the contact tables in a temporary div (temp_div) created at the bottom of the page for
    parsing purposes, with all scripts being loaded
    Fix to do if things are in individual divs

*/
Gov.parse_contact_tables=function(doc,url,resolve,reject,temp_div,dept_name) {
 //   MTP.fix_emails(doc,url);
    console.time("parse_contact_tables");
    var i,table=temp_div.querySelectorAll("table"),j;
    var begin_row=0,title_map={},reverse_title_map={},x,add_count=0,span=doc.querySelectorAll("div"),row;
    Gov.area_code=Gov.get_area_code(doc);
    if(dept_name===undefined||dept_name===null) dept_name="";
    console.log("in parse_contact_tables for "+url+", dept_name="+dept_name+", table.length="+table.length);
    for(i=0;i<span.length;i++) { span[i].parentNode.insertBefore(document.createElement("br"),span[i].nextSibling); }
    for(i=0; i < table.length; i++) {
	if(table[i].rows.length>0) {
	    for(j=0; j < table[i].rows.length; j++) if((row=table[i].rows[j]).cells.length>0 && (!row.cells[0].colSpan || row.cells[0].colSpan===1)) break;
	    if(j<table[i].rows.length) title_map=Gov.guess_title_map(table[i].rows[j]);
	    else continue;
	}
	if((title_map.name===undefined&&(title_map.first===undefined||title_map.last===undefined))||
	   (title_map.title===undefined&&title_map.department===undefined)) {
	    Gov.fix_emails(table[i]);
	    if(!table[i].querySelector("table")) {
		table[i].querySelectorAll("td").forEach(function(elem) {
		    var ret,add_count=0;
		    if(!elem.innerText.match(email_re)) return;
		    let elem_text=Gov.textify_elem(elem);
		    //  console.log("elem.innerText="+elem.innerText);
		    if((ret=Gov.parse_data_func(elem_text)) && ret.name && ret.title
		       && ret.email && ++add_count) Gov.contact_list.push(Object.assign(ret,{department:ret.department!==undefined?ret.department:dept_name})); });
	    }

	    //console.time("add_columns");
	    Gov.add_columns(table[i]);
	    // console.timeEnd("add_columns");

	    if(!table[i].innerText.match(email_re)) continue;
	    console.log("in parse_contact_tables for "+url+", dept_name="+dept_name);


	    /* checks all rows of table here to label */
	    if((title_map=Gov.guess_title_map_unlabeled(table[i]))&&
	       (title_map.name===undefined || (title_map.title===undefined&&title_map.department===undefined) || title_map.email===undefined)) {
		console.log("Bad title_map="+JSON.stringify(title_map));
		//console.log(table[i].querySelector("table")!==null);
		/* May be by individual td */

		continue;
	    }

	}
	else begin_row=j+1;
	console.log("good title_map="+JSON.stringify(title_map));
	var curr_count=Gov.parse_table(table[i],title_map,begin_row,table[i].rows.length,{name:dept_name});
	if(curr_count>0) add_count=add_count+curr_count;
	else if(table[i].innerText.match(email_re)) {
	    table[i].querySelectorAll("td").forEach(function(elem) {
		var ret,add_count=0;

		if((ret=Gov.parse_data_func(elem.innerText)) && ret.name && ret.title
		   && ret.email && ++add_count) Gov.contact_list.push(Object.assign(ret,{department:ret.department!==undefined?ret.department:dept_name})); });
	}
    }
    /* No asynchronous calls so won't happen till after tables finish parsing right? */
    console.time("parse_contact_elems");

    add_count=add_count+Gov.parse_contact_elems(doc,url,resolve,reject,dept_name);
    console.timeEnd("parse_contact_elems");

    console.log("url="+url+", add_count="+add_count);
    console.timeEnd("parse_contact_tables");

    resolve("Done parse_contact_tables, url="+url+", dept_name="+(dept_name?dept_name:""));
};
/**
 * parse individual elements for contacts
 */
Gov.parse_contact_elems=function(doc,url,resolve,reject,name) {
    if(Gov.debug) console.log("in parse_contact_elems for "+url+", "+name);

    var div=doc.querySelectorAll("div,li"),i,add_count=0;
    doc.querySelectorAll("p").forEach(function(inner_p) {
	var ret,span=inner_p.querySelectorAll("span"),text="",nodelist;
	let i;
	//  console.log("inner_p.innerText="+inner_p.innerText);
	if(inner_p.querySelector("p")) return;
	Gov.fix_emails(inner_p);
	nodelist=inner_p.childNodes;
//	text=inner_p.innerText;
	for(i=0;i<nodelist.length;i++) {
	    curr_node=nodelist[i];
	    if(curr_node.nodeType===Node.TEXT_NODE) text=text+"\n"+curr_node.textContent;
	    else if(curr_node.nodeType===Node.ELEMENT_NODE) text=text+"\n"+curr_node.innerText;
	}

	/*span.forEach(function(elem) {
	    text=text.replace(new RegExp(Gov.regexpify_str(elem.innerText)),"$&\t"); });*/

	//console.log("p.innerText="+text);
	if((ret=Gov.parse_data_func(text)) && ret.name && ret.title
	   && ret.email && ++add_count) Gov.contact_list.push(Object.assign(ret,{department:ret.department!==undefined?ret.department:name}));
	else if(text.length>600) inner_p.innerHTML="";
    });
    div.forEach(function(elem) {

	add_count+=Gov.parse_contact_div(elem,name,url); });
    Gov.strip_bad_contacts();
    return add_count;
};
/* Process a string for inclusion in a new RegExp(str) type thing */
Gov.regexpify_str=function(str) {
    str=str.replace(/\)/g,"\\)").replace(/\(/g,"\\(").replace(/\=/,"\\=").replace(/\*/g,"\\*")
	.replace(/\+/g,"\\+").replace(/\?/g,"\\?").replace(/\'/g,"\\'").replace(/[\}\{\[\]]{1}/g,"\\$0");
    return str;
}

/* Gov.textify_elem converts the inner elements into text nicely, returns the text */
Gov.textify_elem=function(elem) {
    var text="";
    var nodelist=elem.childNodes,curr_node,i;
    for(i=0;i<nodelist.length;i++) {
	curr_node=nodelist[i];
	if(curr_node.nodeType===Node.TEXT_NODE) text=text+"\n"+curr_node.textContent;
	else if(curr_node.nodeType===Node.ELEMENT_NODE) text=text+"\n"+curr_node.innerText;
    }
    return text;
};

/* Gov.parse_contact_div, will require splitting into multiple contacts */
Gov.parse_contact_div=function(elem,name,url) {
    //  console.time("contact_div");
    if(Gov.debug) console.log("Gov.parse_contact_div,url="+url);
    // console.log("elem.outerHTML="+elem.outerHTML);
    elem.innerHTML = elem.innerHTML.replace(/&nbsp;/g, ' - ').replace(/\<br\>/g,' - ');
    var ret,p_adds=0,add_count=0;
    var bolds=elem.querySelectorAll("b,strong"),i,curr_text;

    var curr_bold=0,match,curr_regexp;
    var text=elem.innerText.replace(/\n\n+/,"\n");
    var nodelist=elem.childNodes,curr_node;
    Gov.fix_emails(elem);
    text=Gov.textify_elem(elem);
    

/*    for(i=0;i<nodelist.length;i++) {
	curr_node=nodelist[i];
	if(curr_node.nodeType===Node.TEXT_NODE) text=text+"\n"+curr_node.textContent;
	else if(curr_node.nodeType===Node.ELEMENT_NODE) text=text+"\n"+curr_node.innerText;
    }*/
    if((text.length>=1000 && elem.querySelector("div div")) || (text.length>=2000&&(elem.querySelector("div") || elem.querySelector("table"))) ) return 0;
  //   console.log("text="+text);
    if(bolds.length>2) {
//	console.log("Found bolds, text="+text);
	// console.log("text="+text);
	for(i=0;i<bolds.length; i++) {
	    //console.log("bolds["+i+"]="+bolds[i].innerText);
	    curr_regexp=i<bolds.length-1?new RegExp("("+Gov.regexpify_str(bolds[i].innerText.trim())+"[^]*)"+Gov.regexpify_str(bolds[i+1].innerText.trim()),"i") :
		new RegExp("("+Gov.regexpify_str(bolds[i].innerText)+"[^]*)","i");
	    //  console.log("curr_regexp="+curr_regexp);
	    if((match=text.match(curr_regexp)) && match.length>=2 && match[1]!==undefined && (ret=Gov.parse_data_func(match[1].replace(/\n\n+/g,"\n")))
	       && ret.name && ret.title && ret.email && ++add_count) {
		//console.log("match["+i+"]="+JSON.stringify(match));
		Gov.contact_list.push(Object.assign(ret,{department:ret.department!==undefined?ret.department:name})); }
	}
    }

    if((add_count===0) && (ret=Gov.parse_data_func(text)) && ret.name && ret.title && ret.email
       && ++add_count) Gov.contact_list.push(Object.assign(ret,{department:ret.department!==undefined?ret.department:name}));

    Gov.strip_bad_contacts();
    //  console.timeEnd("contact_div");
    return add_count;
};


/* Strip obviously bad,duplicate contacts, also remove %20 from email  */
Gov.strip_bad_contacts=function() {
    var i,temp_list=[],temp_push,ind;
    for(i=Gov.contact_list.length-1; i>=0; i--) {
	//console.log("Gov.contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));
	if(Gov.contact_list[i].email) Gov.contact_list[i].email=Gov.contact_list[i].email.replace(/%20/g,"");
	if(Gov.contact_list[i].department===undefined) Gov.contact_list[i].department="";
	temp_push=Gov.contact_list[i].name+"|"+Gov.contact_list[i].email+"|"+Gov.contact_list[i].department.toString();
	if(Gov.is_bad_contact(Gov.contact_list[i],temp_list,temp_push)) Gov.contact_list.splice(i,1);
	else temp_list.push(temp_push); }
};
/* Check for a bad contact */
Gov.is_bad_contact=function(contact,temp_list,temp_push) {
    var bad_name_regex=/…|\n|((^|[^A-Za-z])(Contact|Department|Address|Staff|question|information|E(-)?mail)($|[^A-Za-z]))/i;
    if(phone_re.test(contact.name)  || temp_list.includes(temp_push) ||
       contact.name.length>60 || contact.title.length>60 || bad_name_regex.test(contact.name) || Gov.title_regex.test(contact.name) ||
       contact.name===contact.department) return true;
    return false;
}

function utf8_to_str(a) {
    for(var i=0, s=''; i<a.length; i++) {
	var h = a[i].toString(16)
	if(h.length < 2) h = '0' + h
	s += '%' + h
    }
    return s;
}
/**
 * Gov.fix_emails in the sense of replace mailto and such, tries to replace some anti-scrape things too.
 * returns the number of successful replacements
 */
Gov.fix_emails=function(div,is_civic) {
    var inner_a=div.querySelectorAll("a"),cf_email,result,fix_count=0,match,email,scripts=div.querySelectorAll("script");
    //console.log("Begin fix_emails, div.innerText="+div.innerHTML);
      if(is_civic||Gov.id==="civicplus") { fix_count=fix_count+Gov.fix_emails_civic(div); }
    scripts.forEach(function(elem) {
	var mail_regex=/mail[^\s\n]*\(\'([^\']*)\',\s*\'([^\']*)\'\)/,match;
	if((match=elem.innerHTML.match(mail_regex))) {
	    if(/\.(com|edu|gov|org|us|net)$/.test(match[1])) elem.innerHTML=match[2]+"@"+match[1];
	    else elem.innerHTML=match[1]+"@"+match[2]; }
	else if(/var addy/.test(elem.innerHTML)) {
	    var text=elem.innerHTML.match("var addy([^]+)"),addy_textmatch,temp_regex=/\'([^\']*)\'/g,str="",i;
	    if(!text) return;
	    text=text[1].replace(/document\.write[^]+/,"").replace(/&#([\d]+);/g,function(match,p1) { return String.fromCharCode(parseInt(p1)); });
	    if((addy_textmatch=text.match(/var addy_text[\d]+\s*\=\s*\'([^\']+)\';/))) {
		str=str+addy_textmatch[1]+"\n";
		text=text.replace(/var addy_text[\d]+\s*\=\s*\'([^\']+)\';/,""); }
	    if(match=text.match(temp_regex)) for(i=0;i<match.length;i++) str=str+match[i].replace(/\'/g,"")
	    elem.innerHTML=str.toString()+"<br>";
	}
	else elem.innerHTML="";
	div.querySelectorAll("style").forEach(function(elem) { elem.innerHTML=""; });
    });

    inner_a.forEach(function(elem) {
	//console.log("elem.innerText="+elem.outerHTML);
	if(typeof(elem.href)==="object") return;
	//            console.log("elem.href="+elem.href);
	elem.href=elem.href.replace(/^.*\#MAIL:/,"mailto:").replace(/[\(\[]{1}at[\]\)]{1}/,"@").replace(/[\(\[]{1}dot[\]\)]{1}/,".");
	if(/^\s*mailto:\s*/.test(elem.href) && (++fix_count || true)) {
	    elem.innerHTML=(!(/Contact|Email/i.test(elem.innerText)||elem.innerText.match(email_re))
			    ?elem.innerHTML+"\t":"")+elem.href.replace(/^\s*mailto:\s*/,"").replace("%20","")+"\t";
	    elem.href="";
	}
	else if((match=elem.href.match(email_re))) {
	    elem.innerHTML=(!(/Contact|Email/i.test(elem.innerText)||elem.innerText.match(email_re))
			    ?elem.innerHTML+"\t":"")+match[0]+"\t";
	    elem.href=""; }
	if(((cf_email=elem.getElementsByClassName("__cf_email__")).length>0 &&cf_email[0].dataset&&(email=cf_email[0].dataset.cfemail)) ||
	   ((match=/\/cdn-cgi\/l\/email-protection\#(.*)$/)&&(email=match[1]))
	  ) elem.innerHTML=MTurkScript.prototype.cfDecodeEmail(email);
    });
    Gov.fix_emails_civic(div);
  
    //console.log("End fix_emails, div.innerText="+div.innerHTML);

    return fix_count;
};
/**
 * Special civic decoding
 */
Gov.fix_emails_civic=function(div) {
    if(Gov.debug) console.log("** fix_emails_civic");
    var w_match,x_match,fix_count=0;
    w_match=div.innerText.match(/var\s*w\s*\=\s*\'([^\']+)\'/);
    x_match=div.innerText.match(/var\s*x\s*\=\s*\'([^\']+)\'/);
    if(w_match && x_match &&(++fix_count || true)) div.innerHTML=w_match[1]+"@"+x_match[1];
};
Gov.print_row=function(curr_row,i) {
    var j,row_str='(';
    for(j=0;j<curr_row.cells.length;j++) row_str=row_str+(row_str.length>1?";":"")+curr_row.cells[j].innerText.trim();
    row_str=row_str+")";
    if(row_str.split("\n").length<4) console.log("@ row["+i+"][0]="+row_str);
};


/* Gov.parse_table parses a generic table for contacts.
 * table is the table to parse, title_map maps (name,title,phone,email) to column number
 * reverse_title_map maps column number to name,title,phone,email (maybe fix to not need both)
 * it returns the number of contacts added successfully
 * TODO: fix to work with guess_table_map to deal with more complicated tables
 */
Gov.parse_table=function(table,title_map,begin_row,end_row,dept) {
   
    console.log("In parse_table");
    console.time("parse_table");
    var i,j,x,curr_row,curr_contact,inner_a,title,reverse_title_map={};
    var add_count=0,curr_cell,match,row_str;
    for(x in title_map) reverse_title_map[title_map[x]]=x;
    if(begin_row===undefined || begin_row===null) begin_row=1;
    if(end_row===undefined || end_row===null) end_row=table.rows.length;
    if(!dept || !dept.name) dept={};
    for(i=begin_row; i < end_row; i++)  {
	curr_row=table.rows[i];
	row_str="(";
	if(curr_row.cells.length>0) {
	    Gov.print_row(curr_row,i);
	}
	curr_contact={};
	for(j=0; j < curr_row.cells.length; j++)
	{
	    curr_cell=curr_row.cells[j];
	    title=reverse_title_map[j];
	    //console.log("curr_cell["+i+","+j+"]="+curr_cell.innerText+", title="+title);

	    if(title==="email" && (Gov.fix_emails(curr_cell,true)||true)) {// && (inner_a=curr_cell.getElementsByTagName("a")).length>0) {
		curr_contact[title]=curr_cell.innerText.trim();
		// console.log("veryFirst: curr_contact["+title+"]="+curr_contact.title);
	    }
	    else if(title==="name" && title_map["title"]===undefined &&
		    (match=curr_cell.innerText.trim().match(/^([^\s,]+\s+[^\s,]+[^,]*),(.*)$/))) {
		curr_contact.name=match[1].trim();
		curr_contact.title=match[2].trim();
	    }
	    else if(title) curr_contact[title]=curr_cell.innerText.replace(/\s+\n\s+/g," ").trim();
	    if(title==="phone" && !curr_contact[title].match(phone_re) &&curr_contact[title].length>0 &&
	       !curr_contact[title].match(Gov.area_code)) curr_contact[title]=Gov.area_code+curr_contact[title].trim();
	    if(title==="title") curr_contact[title]=curr_contact[title];
	    if(title_map.email===undefined && (inner_a=curr_cell.getElementsByTagName("a")).length>0 &&
	       /^\s*mailto:\s*/.test(inner_a[0].href)) {
		curr_contact.email=inner_a[0].href.replace(/^\s*mailto:\s*/,"").replace(/\n.*$/,"");
	    }

	}
	//console.log("curr_contact="+JSON.stringify(curr_contact));
	if((curr_contact.name||(curr_contact.first&&curr_contact.last))
	   && curr_contact.title && (++add_count)) {
	    if(!curr_contact.name && curr_contact.first&&
	       curr_contact.last) curr_contact.name=curr_contact.first+" "+curr_contact.last;
	    if(dept.name && curr_contact.department===undefined) curr_contact.department=dept.name;
	    if(dept.phone && (!curr_contact.phone||curr_contact.phone.length===0)) curr_contact.phone=dept.phone;
	    curr_contact.name=Gov.parse_name_func(curr_contact.name);
	    if(!curr_contact.email) curr_contact.email="";
	    curr_contact.email=curr_contact.email.replace(/\n.*$/g,"").replace(/\n.*$/,"");
	    Gov.contact_list.push(curr_contact);
	}
	else if(curr_contact.title) { dept.name=curr_contact.title; };

    }
    Gov.strip_bad_contacts();
    console.timeEnd("parse_table");

    return add_count;
};

/* Gov.parse_contacts_then is called after a single contact page is parsed */
Gov.parse_contacts_then=function(result) {
    var i;
  //  console.log("Gov.parse_contacts_then: "+result);
    for(i=0; i < Gov.contact_list.length; i++)
    {
//	console.log("contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));
    }

};

/* Gov.guess_title_map tries to map in a simple manner the table columns to data types,
 * name,title,phone,email in particular
 * row is the putative header row.
 * TODO: make suitable for annoying weird-type tables with multiple elements per column */
Gov.guess_title_map=function(row) {
    var i,curr_cell,ret={},x;
    var title_map={"department":/(Department|Dept)/i,"first":/First/i,"last":/Last/i,name:/(Staff|Name|Employee|Contact)/i,"email":/mail/i,
		   "title":/(Title|Position|Profession|Rank|Job)/i,phone:/(Tel|Phone|Number|Voicemail)/i,"officer":/officer/i};
    for(i=0;i<row.cells.length; i++) {
	curr_cell=row.cells[i].innerText.trim();
	for(x in title_map) if(title_map[x].test(curr_cell)) ret[x]=i;
    }
    if(ret.name===undefined&&ret.officer!==undefined) ret.name=ret.officer;
    // if(ret.department!==undefined && ret.title===undefined) { ret.title=ret.department; delete ret.department; }
    return ret;

};

/* Gov.guess_title_map_unlabeled tries to map in a simple manner the table columns to data types,
 * name,title,phone,email based on form of rows
 * row is the putative header row.
 * TODO: make suitable for annoying weird-type tables with multiple
 * elements per column, maybe by adding add'l column */
Gov.guess_title_map_unlabeled=function(table) {
    console.log("in guess_title_map unlabeled");
    console.time("guess_title_map_unlabeled");
    var i=table.rows.length-1,j,curr_cell,ret={},row,inner_a,added_column=false,new_cell,email_match;
    while(i>=0 && ((row=table.rows[i]).cells.length===0 || (row.cells[0].innerText.trim().length===0))) i--;
    if(i<0) return ret;
    for(j=table.rows.length-1;j>=0; j--) {
	row=table.rows[j];ret={};added_column=false;
	Gov.print_row(row,j);
	for(i=0;i<row.cells.length; i++) {
	    curr_cell=row.cells[i].innerText.replace(/^[\s_\.\-]+/g,"").trim();
	    if(email_re.test(curr_cell)) ret.email=i;
	    else if((inner_a=row.cells[i].getElementsByTagName("a")).length>0 &&
		    (email_match=inner_a[0].href.match(/^\s*mailto:\s*(.*)$/i))) ret.email=i;
	    else if(phone_re.test(curr_cell)|| (/^[\d]{3}-[\d]{4}$/).test(curr_cell)) ret.phone=i;
	    else if(ret.name===undefined && !(ret.title===undefined && Gov.title_regex.test(curr_cell)) && curr_cell.length>0 &&
		    curr_cell.length<200&&
		    nlp(curr_cell).people().out('terms').length>0
		   ) ret.name=i;
	    else if(ret.title===undefined && curr_cell.length>0 && /[A-Za-z]+/.test(curr_cell)) ret.title=i;
	    //   else console.log("("+i+"), finding nothing: "+row.cells[i].innerHTML);
	}
	//console.log("unlabeled ret["+j+"]="+JSON.stringify(ret)+", "+row.cells[0].innerText);
	//if(ret.name===undefined && j<table.rows.length-6) break;
	console.log("title_map_unlabeled, ret="+JSON.stringify(ret));
	if(ret.title!==undefined&&ret.name!==undefined&&ret.email!==undefined) break;
    }
    console.timeEnd("guess_title_map_unlabeled");
    return ret;
};
/* Deals with situation where one column has multiple rows in one */
Gov.add_columns=function(table) {
    var row,cell,i,j,added_column=false,new_cell,email_match,inner_a;
    for(i=0;i<table.rows.length; i++) {
	row=table.rows[i];
	added_column=false;
	for(j=0;j<row.cells.length; j++) {
	    cell=row.cells[j];
	    if((inner_a=cell.getElementsByTagName("a")).length>0 && !/(^|[^A-Za-z]{1})(Click|Contact|E(-)?mail)/.test(cell.innerText.trim()) &&
	       (email_match=inner_a[0].href.match(/^\s*mailto:\s*(.*)$/i))) {
		cell.innerHTML=cell.innerText;
		row.insertCell().innerHTML=email_match[1].replace(/^.*%3C/,"").replace(/%3E$/,"");
	    }
	    /*if(cell.innerText.split(/[\n,]/).length>1 && !added_column) {
	      added_column=true;
	      (new_cell=row.insertCell(j+1)).innerHTML=cell.innerText.replace(/^[^\n,]+/,"");
	      cell.innerHTML=cell.innerHTML.replace(new_cell.innerHTML,"");
	      }*/

	}
    }
    Gov.fix_table(table,"commas");
    Gov.fix_table(table,"honorifics");
};
/* Find the "bad column" */
Gov.find_col=function(table,type) {
    /* Find column containing honorific for persons */
    var i,j,row,cell,result,k,match;
    for(i=0;i<table.rows.length/2.;i++) {
	for(j=0;j<table.rows[i].cells.length;j++) {
	    if(table.rows[i].cells[j].innerText.trim().length>250) continue;
	    if(type==="honorifics" && (result=nlp(table.rows[i].cells[j].innerText).people().out('terms'))) {
		for(k=0;k<result.length;k++) if(result[k].tags.includes("Honorific")&&result[k].tags.includes("Person")) return j; }
	    else if(type==="commas" && (match=table.rows[i].cells[j].innerText.match(/^([^,]+),(.*)$/))) {
		for(k=1;k<match.length;k++) if(result=nlp(match[k]).people().out('terms').length>1) return j; }
	}
    }
    return -1;
};
/* Strip honorifics and treat them as title row if necessary */
Gov.fix_table=function(table,type) {
    var i,j,row,cell,to_fix,result,new_col_str,old_col_str,match,temp_str;
   // console.log("Fixing "+type);
    if((to_fix=Gov.find_col(table,type))<0) return;
    console.log("Fixing "+type+", col="+to_fix);
    for(i=0;i<table.rows.length;i++) {
	row=table.rows[i];
	new_col_str=old_col_str='';
	Gov.print_row(row,i);
	while(to_fix>=row.cells.length) row.insertCell();
	if(type==="honorifics") {
	    result=nlp(row.cells[to_fix].innerText).people().out('terms');
	    old_col_str=row.cells[to_fix].innerText;
	    console.log("result="+JSON.stringify(result));
	    for(j=0;j<result.length;j++) {
		if(result[j].tags.includes("Honorific")) {
		    new_col_str=new_col_str+(new_col_str.length>0?" ":"")+result[j].text;
		    old_col_str=old_col_str.replace(result[j].text,"").trim();
		}
	    }
	}
	else if(type==="commas") {
	    old_col_str=(match=row.cells[to_fix].innerText.match(/^[^,]*/))?match[0]:"";
	    new_col_str=(match=row.cells[to_fix].innerText.match(/^[^,]*,(.*)$/))?match[1]:"";
	    if(result=nlp(new_col_str).people().out('terms').length>1) {
		temp_str=new_col_str;
		new_col_str=old_col_str;
		old_col_str=temp_str; }
	}
	row.insertCell(to_fix+1).innerHTML=new_col_str;
	row.cells[to_fix].innerHTML=old_col_str;
	Gov.print_row(row,i);
    }




};


/* Gov.parse_name_func is a helper function for parse_data_func */
Gov.parse_name_func=function(text) {
    var split_str,fname,lname,i;
    var appell=[/^Mr([\.\s]{1})\s*/,/^Mrs\.?\s*/,/^Ms\.?\s*/,/^Miss\s*/,/^Dr([\.\s]{1})\s*/],suffix=[/,?\s*Jr\.?/];
    for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
    if(text!==undefined && /[a-z]{2,}/.test(text)) {
	while(text!==undefined && /(,?\s*[A-Z]+)$/.test(text)) {
	    text=text.replace(/(,?\s*[A-Z]+)$/,""); }
    }
    for(i=0; i < suffix.length; i++) text=text.replace(suffix[i],"");
    return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
};
/**
 * Gov.parse_data_func parses text
 */
Gov.parse_data_func=function(text) {
    
    var ret={};
    var fname="",lname="",i=0,j=0, k=0;
    var curr_line, s_part="", second_arr,begin_name="";

    var has_pasted_title=false,title_prefix,dept_name;
   // if(!/@/.test(text)) return;
    if(Gov.debug) console.log("text="+text);
    text=text.replace(/ (?:has served as|is) the ([A-Z]+)/,",$1");
    text=text.replace(/([a-z]{1})([A-Z][a-z]+:)/g,"$1\t$2").replace(/([a-z]{1})\s{1,}([\d]{1})/g,"$1\t$2")
	.replace(/([\d]{1})\s{1,}([A-Za-df-wy-z]{1})/g,"$1\t$2").replace(/([A-Za-z]{1})\s([A-Za-z0-9\._]+@)/,"$1\t$2")
	.replace(/([^\s]+)\s+([^\s@]+@[^\s@]+)/g,"$1\t$2")
	.replace(/(-[\d]+)([a-zA-Z]+)/g,"$1\t$2").replace(/([a-zA-Z]+)([\d]+-)/g,"$1\t$2");;
    if((text=text.trim()).length===0) return ret;
    var split_lines_1=(text=text.trim()).split(Gov.split_lines_regex),split_lines=[],temp_split_lines,new_split;
    var found_email=false,split_comma,found_phone=false;
    if(/^[^\s]+\s+[^\s]+,\s*[A-Z\.]*[^A-Z\s\n,]+/.test(split_lines_1[0])) {
	split_lines=split_lines_1[0].split(",").concat(split_lines_1.slice(1)); }
    else split_lines=split_lines_1;
    if((split_comma=split_lines[0].split(","))&&split_comma.length>1&&Gov.title_regex.test(split_comma[0])) {
	split_lines=split_comma.concat(split_lines.slice(1)); }
    if(Gov.debug) console.log("split_lines="+JSON.stringify(split_lines));
    split_lines=split_lines.filter(line => line && line.replace(/[\-\s]+/g,"").trim().length>0);
    split_lines=split_lines.map(line => line.replace(/^\s*[\(]*(\s*[^\d]+)/,"$1").replace(/[\)]*\s*$/,"").trim());


    if(split_lines.length>0&&(split_comma=split_lines[0].split(","))&&split_comma.length>1&&Gov.title_regex.test(split_lines[0])) {
	split_lines=split_comma.concat(split_lines.slice(1)); }
    if(Gov.debug) console.log("split_lines="+JSON.stringify(split_lines));
    if(split_lines.length>0&&Gov.dept_name_regex.test(split_lines[0])) {
	ret.department=split_lines[0];
//	console.log("$$ SET ret.department="+ret.department);
	split_lines=split_lines.slice(1); }
    while(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").filter(line=>line && line.trim().length>0).concat(split_lines.slice(1));

    /** Additional code **/
    if(Gov.title_regex.test(split_lines[0]) &&
       (temp_split_lines=split_lines.splice(0,1))) {
	split_lines.splice(1,0,temp_split_lines[0]); }

    if(split_lines.length>0&&(title_prefix=split_lines[0].match(Gov.title_prefix_regex))) {
	split_lines=[split_lines[0].replace(Gov.title_prefix_regex,"")].concat([title_prefix[0]].concat(split_lines.slice(1))); }
    while(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").filter(line=>line && line.trim().length>0).concat(split_lines.slice(1));
    /** End additional code **/

    var good_stuff_re=/[A-Za-z0-9]/;
    if(split_lines===null) return;
    
    for(j=0; j < split_lines.length; j++) {
	if(split_lines.length>0 && split_lines[j] && split_lines[j].trim().length > 0
	   && good_stuff_re.test(split_lines[j]) && !Gov.bad_stuff_re.test(split_lines[j])&& !(split_lines[j].match(email_re))) break;
	//   else { console.log("split_lines["+j+"], bad_stuff="+split_lines[j].match(Gov.bad_stuff_re)); }
    }
    if(j>=split_lines.length) return ret;
    split_comma=split_lines[j].split(/,/);
    if(split_comma.length===2 && /[^\s]\s/.test(split_comma[0])) {
	// console.log("Doing split_comma");
	var curr_last=split_lines.length-1;
	split_lines.push(split_lines[curr_last]);
	for(k=curr_last; k>=j+2; k--) split_lines[k]=split_lines[k-1];
	split_lines[j]=split_comma[0];
	split_lines[j+1]=split_comma[1];
    }
    if(split_lines.length>0 && j<split_lines.length &&
       split_lines[j] && split_lines[j].trim().length > 0) {
	if(!/\s/.test((begin_name=split_lines[j].trim()))
	   && j+1 < split_lines.length) begin_name=begin_name+" "+split_lines[(j++)+1];
	ret.name=Gov.parse_name_func(begin_name?begin_name:"");
    }
    if(Gov.debug) console.log("parse_data_func: "+JSON.stringify(split_lines)+", j="+j);
    for(i=j+1; i < split_lines.length; i++) {
	if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
	//  console.log("i="+i+", split_lines[i]="+split_lines[i]);
	curr_line=split_lines[i].trim();

	second_arr=curr_line.split(/:\s+/);
	if(/Title:/.test(curr_line) && (ret.title=curr_line.replace(/.*Title:\s*/,"").trim()) && (has_pasted_title=true)) continue;
	//  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
	s_part=second_arr[second_arr.length-1].trim();
	//console.log("s_part="+s_part);
	if(email_re.test(s_part) && !found_email &&(found_email=true)) ret.email=s_part.match(email_re)[0];
	else if((phone_re.test(s_part)||/^ext\./i.test(s_part)) && !found_phone && (found_phone=true)) ret.phone=s_part.match(phone_re) ? s_part.match(phone_re)[0]:s_part;
	else if(s_part.length>10 && !found_phone && s_part.substr(0,10)==="Phone Icon" &&
		phone_re.test(s_part.substr(11)) && (found_phone=true)) ret.phone=s_part.substr(11).match(phone_re)[0];
	else if((s_part.trim().length>0  && !has_pasted_title) || s_part.indexOf("Title:")!==-1) {
	    if(/^ext/.test(s_part)) ret.phone=(ret.phone+" "+s_part.trim()).trim();
	    else if((has_pasted_title=true)) ret.title=s_part.replace(/^Title:/,"").trim();
	}
	else if(has_pasted_title && ret.title && !Gov.title_regex.test(ret.title) &&
		Gov.title_regex.test(s_part)) ret.title=s_part.trim();
    }
    //console.log("ret="+JSON.stringify(ret));
    return ret;
};




/* Get the contact links for a given department page */
Gov.get_department_contact_links=function(doc,url,resolve,reject,dept) {
    console.log("dept="+dept);
    Gov.depts[dept]={};
    Gov.depts[dept].contact_links=[];
    Gov.depts[dept].external_links=[];
    var i,j, contact_regex=/Contact|Staff/i, contacthref_regex=/contact/i,x;
    var dept_regex=new RegExp(dept,"i"),out_str="";
    for(i=0; i < doc.links.length; i++) {
	doc.links[i].href=MTurkScript.prototype.fix_remote_url(doc.links[i].href,url).replace(/^https:/,"http:").replace(/\/$/,"");
	// || contacthref_regex.test(doc.links[i].href)
	if((contact_regex.test(doc.links[i].innerText)) &&
	   !Gov.bad_contact_regex.test(doc.links[i].innerText) &&
	   !Gov.bad_link_regex.test(doc.links[i].href) && !Gov.includes_link(Gov.contact_links,{url:doc.links[i].href,name:doc.links[i].innerText}) &&
	   !Gov.bad_out_link_regex.test(doc.links[i].href) && !Gov.includes_link(Gov.depts[dept].contact_links,{url:doc.links[i].href,name:doc.links[i].innerText})
	  ) Gov.depts[dept].contact_links.push({url:doc.links[i].href,name:doc.links[i].innerText});
	if(dept!==undefined && MTP.get_domain_only(url,true)!==MTP.get_domain_only(doc.links[i].href,true) &&
	   !Gov.includes_link(Gov.depts[dept].contact_links,{url:doc.links[i].href,name:doc.links[i].innerText}) &&
	   dept_regex.test(doc.links[i].innerText) && !Gov.bad_link_regex.test(doc.links[i].href) &&
	   Gov.depts[dept].external_links.length<2
	  ) Gov.depts[dept].external_links.push(doc.links[i].href);
    }
    for(i=Gov.depts[dept].contact_links.length-1;i>=0;i--) {
	console.log("#@ Gov.depts["+dept+"].contact_links["+i+"]="+JSON.stringify(Gov.depts[dept].contact_links[i]));
	for(x in Gov.depts) {
	    if(x===dept) continue;
	    if(Gov.includes_link(Gov.depts[x].contact_links,Gov.depts[dept].contact_links[i])) Gov.depts[dept].contact_links.splice(i,1);


	}
    }
    console.log("Gov.depts["+dept+"].contact_links="+JSON.stringify(Gov.depts[dept].contact_links));
    console.log("Gov.depts["+dept+"].external_links="+JSON.stringify(Gov.depts[dept].external_links));
};
/* Gov.includes_link checks if a link  represented by new_elem={url:url,name:name} is found already in dept_list */
Gov.includes_link=function(dept_list,new_elem,is_dept) {
    if(is_dept===undefined) is_dept=false;
    if(!new_elem) return true;
    for(var i=0;i<dept_list.length;i++) {
	//console.log("new_elem.url="+new_elem.url+", dept_list["+i+"].url="+dept_list[i].url);
	if(!new_elem.url ||
	   (new_elem.url&&dept_list[i].url&&new_elem.url===dept_list[i].url || (is_dept&&new_elem.name===dept_list[i].name))) return true; }
    return false;
};
/*

  Grabs the contact page links from the main page
  Maybe make scraping contact links a generic thing for MTurkScripts ...
  dunno if form thing should be left out
*/
Gov.get_contact_links=function(doc,url,resolve,reject) {
    var i,j,contacthref_regex=/contact/i,out_str="",bad_dept_regex=/Events|Minutes|Agenda/;
    Gov.dept_page="";
    for(i=0; i < doc.links.length; i++) {
	doc.links[i].href=MTurkScript.prototype.fix_remote_url(doc.links[i].href,url).replace(/^https:/,"http:").replace(/\/$/,"");
	out_str=doc.links[i].href+", "+doc.links[i].innerText+": ";
	if(Gov.debug) console.log("links["+i+"]={url:"+doc.links[i].href+",name:"+doc.links[i].innerText.trim());
	// || contacthref_regex.test(doc.links[i].href)
	if((Gov.contact_regex.test(doc.links[i].innerText)) &&
	   !Gov.bad_contact_regex.test(doc.links[i].innerText)&&
	   !Gov.bad_link_regex.test(doc.links[i].href) && !Gov.includes_link(Gov.contact_links,{url:doc.links[i].href,name:doc.links[i].innerText.trim()}) &&
	   !Gov.bad_out_link_regex.test(doc.links[i].href) &&
	   !MTP.is_bad_url(doc.links[i].href,[],-1,Gov.id==="govoffice"?undefined:4)) Gov.contact_links.push({url:doc.links[i].href,name:doc.links[i].innerText.trim()});
	if(Gov.matches_dept_regex(doc.links[i].innerText.trim()) && !Gov.bad_out_link_regex.test(doc.links[i].href) &&
	   !Gov.includes_link(Gov.dept_links,{url:doc.links[i].href,name:doc.links[i].innerText.trim()},true) && !Gov.bad_link_regex.test(doc.links[i].href) &&
	   !bad_dept_regex.test(doc.links[i].innerText)) Gov.dept_links.push({url:doc.links[i].href,name:doc.links[i].innerText.trim()});
	if(/^Department|Municipal Departments|Departments/.test(doc.links[i].innerText) && Gov.dept_page.length===0 && !Gov.bad_link_regex.test(doc.links[i].href)) Gov.dept_page=doc.links[i].href;
	
	//  if(/matched/.test(out_str)) console.log("out_str["+i+"]="+out_str);

    }
    console.log("Gov.dept_links="+JSON.stringify(Gov.dept_links));
    console.log("Gov.contact_links="+JSON.stringify(Gov.contact_links));

};

var emailProtector=emailProtector||{};
emailProtector.addCloakedMailto=function(g,l){
    var h=document.querySelectorAll("."+g),i;
    for(i=0;i<h.length;i++){
	var b=h[i],k=b.getElementsByTagName("span"),e="",c="";
	b.className=b.className.replace(" "+g,"");
	for(var f=0;f<k.length;f++) {
	    for(var d=k[f].attributes,a=0;a<d.length;a++) {
		0===d[a].nodeName.toLowerCase().indexOf("data-ep-acd80")&&(e+=d[a].value),
		0===d[a].nodeName.toLowerCase().indexOf("data-ep-bc962")&&(c=d[a].value+c); }
	}
	if(!c) break;
	b.innerHTML=e+c;
	if(!l )break;
	b.parentNode.href="mailto:"+e+c
    }
};

Gov.scrape_qscend=function(doc,url,resolve,reject) {
    console.log("Gov.scrape_qscend, not written,deferring to scrape_none");
    Gov.scrape_none(doc,url,resolve,reject);
};



/* Gov.scrape_civicplus scrapes the civicplus directory system
   Needs work to allow it to only scrape the directories likely to have the queried contacts, far too slow to scrape them all
*/
Gov.scrape_civicplus=function(doc,url,resolve,reject) {
    var directory_promise=MTurkScript.prototype.create_promise(url.replace(/\/$/,"")+"/Directory.aspx",
							       Gov.parse_civicplus_directory,resolve,
							       reject); };

/* Gov.parse_civicplus_directory parses the civicplus_directory page */
Gov.parse_civicplus_directory=function(doc,url,resolve,reject) {
    var promise_list=[],i,h2,j,a;
    console.log("In parse_civicplus_directory");
    var search_area=doc.querySelector("#CityDirectoryLeftMargin .topmenu");
    if(doc.getElementById("404Content") ||
       ((h2=doc.querySelector(".content .pane-content h2")) && /Page Not Found/i.test(h2.innerText)) || !search_area) { return Gov.parse_civicplus_no_directory(doc,url,resolve,reject); }
    //   var search_divs=doc.querySelectorAll("#CityDirectoryLeftMargin .topmenu > div");
    /* for(i=0;i<search_divs.length;i++) {

       for(j=0;j<search_divs[i].children.length;j++) {
       if((a=search_divs[i].children[j].tagName==="A") && (true||/Directory\.aspx\?did\=/i.test(a.href)) &&
       (Gov.matches_dept_regex(a.innerText)||/Administration/.test(a.innerText))) console.log(search_divs[i].children[j].innerText);
       }
       }*/
    /* Try based on lack of CityDirectoryLeftMargin */
    var links=search_area.getElementsByTagName("a");
    console.time("contacts");
    for(i=0; i < links.length; i++)
    {
	if(/Directory\.aspx\?did\=/i.test(links[i].href) && (Gov.matches_dept_regex(links[i].innerText)||
							     /Administration/.test(links[i].innerText))) {
	    promise_list.push(MTP.create_promise(MTP.fix_remote_url(links[i].href,url),Gov.get_civicplus_contacts,MTP.my_then_func,
						 MTP.my_catch_func,links[i].innerText)); }
    }
    /** Add everything if no directory found */
    if(promise_list.length===0 && links.length>0) {
	for(i=0; i < links.length; i++)
	{
	    promise_list.push(MTP.create_promise(MTP.fix_remote_url(links[i].href,url),Gov.get_civicplus_contacts,MTP.my_then_func,
						 MTP.my_catch_func,links[i].innerText));
	}
    }
    Promise.all(promise_list).then(
	function(response) {
	    console.timeEnd("contacts");
	    resolve(response);
	});
};
/** TODO: not always table[0] ***/
Gov.get_civicplus_contacts=function(doc,url,resolve,reject,text) {
    var table,i,j,x,curr_row,title_map,dept={},DirCat,phone_match,tab_area;
    console.log("In Gov.get_civic_plus_contacts for "+text);
    if((DirCat=doc.getElementsByClassName("DirectoryCategoryText")).length>0) {
	dept.name=DirCat[0].innerText.trim();
	if(phone_match=DirCat[0].parentNode.innerText.match(/Phone:\s*([\(\)\s\d\-]+)/)) dept.phone=phone_match[1];
    }
    tab_area=doc.getElementById("CityDirectoryLeftMargin") ? doc.getElementById("CityDirectoryLeftMargin") : doc;
    if((table=tab_area.getElementsByTagName("table")).length>0) {
	for(i=0; i < table[0].rows.length; i++)  {
	    if((curr_row=table[0].rows[i]).cells.length>0 &&
	       (!curr_row.cells[0].colSpan || curr_row.cells[0].colSpan===1)) break;
	}

	title_map=Gov.guess_title_map(table[0].rows[i]);
	console.log("title_map="+JSON.stringify(title_map));
	if(!(title_map.name===undefined||title_map.title===undefined)) Gov.parse_table(table[0],title_map,i+1,table[0].rows.length,dept);
    }
    resolve("");
};
/* Gov.parse_civicplus_no_directory parses civicplus with no directory.aspx
   TODO: are there cases where directory exists, but contact data is mostly elsewhere?
*/
Gov.parse_civicplus_no_directory=function(doc,url,resolve,reject) {
    console.log("# civicplus, no directory found, trying individual departments");
    var depts=doc.querySelectorAll(".menu-minipanel-mega-menu-departments a"),i,promise_list=[],sf_list;
    if(depts.length===0) {
	console.log("no mega-menu shit");
	sf_list=doc.querySelectorAll(".sf-depth-1");
	for(i=0;i<sf_list.length;i++) {
	    if(/Departments/.test(sf_list[i].innerText))
	    {
		console.log("Found Departments");
		if(depts=sf_list[i].parentNode.querySelectorAll("a")) break;
	    }
	}
    }
    for(i=0;i<depts.length;i++) {
	depts[i].href=MTP.fix_remote_url(depts[i].href,url);
	//console.log("depts["+i+"].href="+depts[i].href);
	if(Gov.matches_dept_regex(depts[i].innerText) && !/\.pdf$/.test(depts[i].href)) {
	    promise_list.push(MTP.create_promise(depts[i].href,Gov.parse_civicplus_dept,MTP.my_then_func,MTP.my_catch_func,depts[i].innerText)); }
    }
    if(promise_list.length===0) return Gov.scrape_none(doc,url,resolve,reject);
    else Promise.all(promise_list).then(function(response) { resolve(response); });
};
/* parses an individual civicplus department page for the ones that don't have the directories */
Gov.parse_civicplus_dept=function(doc,url,resolve,reject,dept_name) {
    var table=doc.querySelector(".view-group-staff-contacts table");
    console.log("@@@ In Gov.parse_civicplus_dept, url="+url+", name="+dept_name);
    if(table&&table.rows.length>0) Gov.parse_civicplus_dept_table(table,dept_name,url,resolve,reject);
    else { console.log("\t no dept_table found"); resolve(""); }

};
/* parses a department page style civicplus table */
Gov.parse_civicplus_dept_table=function(table,dept_name,url,resolve,reject) {
    var title_map=Gov.guess_title_map(table.rows[0]),curr_contact,i,row,x,match,a,promise_list=[];
    console.log("title_map="+JSON.stringify(title_map));
    for(i=1;i<table.rows.length;i++) {
	curr_contact={};
	row=table.rows[i];
	for(x in title_map) curr_contact[x]=row.cells[title_map[x]].innerText.trim().replace(/\s*-\s+.*/,"");
	curr_contact.department=dept_name;
	if(title_map.name!==undefined&&(a=row.cells[title_map.name].querySelector("a"))&&
	   (match=a.href.match(/\/users\/([^\/]+)/))) curr_contact.email=match[1]+"@"+MTP.get_domain_only(url,true);
	if(curr_contact.name&&curr_contact.title&&curr_contact.email&&Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
	else if(curr_contact.name&&curr_contact.title&&Gov.matches_title_regex(curr_contact.title)&&a) {
	    promise_list.push(MTP.create_promise(MTP.fix_remote_url(a.href,url),Gov.grab_civicplus_email,MTP.my_then_func,
						 MTP.my_catch_func,curr_contact)); }
    }
    Promise.all(promise_list).then(function(response) { resolve("Done "+dept_name+" "+response); });
};
Gov.grab_civicplus_email=function(doc,url,resolve,reject,curr_contact) {
    var urls=doc.querySelectorAll(".breadcrumb a"),i,match;
    urls.forEach(function(a) { if((match=a.href.match(/\/users\/([^\/]+)/))) curr_contact.email=match[1]+"@"+MTP.get_domain_only(url,true); });
    if(curr_contact.name&&curr_contact.title&&curr_contact.email&&Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
    resolve("");
};
/* Granicus/civicasoft scraper */
Gov.scrape_granicus=function(doc,url,resolve,reject) {
    console.log("in civicasoft/granicus, url="+url);
    var nav_url=url.replace(/\/$/,"")+"/navdata/mainnav.js";
    var promise=MTP.create_promise(url.replace(/\/$/,"")+"/custom/phonebook/json/staff-directory2csalpha.asp",Gov.get_granicus_staff_directory,
				   function(response) {
				       var promise2=MTP.create_promise(nav_url,Gov.parse_civicasoftnav,resolve,reject,doc); });
};
Gov.get_granicus_staff_directory=function(doc,url,resolve,reject,response) {
    console.log("get_granicus_staff_directory,url="+url);
    var text=response.responseText,parsed;
    console.log("text="+text);
    try {
	parsed=JSON.parse(text);

	console.log("parsed="+JSON.stringify(parsed));
	var i,j,curr_elem,dept,curr_person;
	for(i=0;i<parsed.length;i++) {
	    dept=parsed[i].SubGroupName||"";
	    if(!parsed[i].contacts) continue;
	    for(j=0;j<parsed[i].contacts.length;j++) {
		curr_elem=parsed[i].contacts[j];
		curr_person={name:curr_elem.name?curr_elem.name:"",
		title:curr_elem.title?curr_elem.title:"",
			     phone:curr_elem.phone?curr_elem.phone:"",
			     email:curr_elem.Emails?curr_elem.Emails.replace(/,.*$/,""):""
			     ,department:dept};
		Gov.contact_list.push(curr_person);
	    }
	}
		
    }
    catch(error) { console.log("error "+error); }
    resolve("");

};
Gov.parse_civicasoftnav=function(doc,url,resolve,reject,old_doc) {
    console.log("in parse_civicasoftnav, url="+url);
    var base_url=url.replace(/(^https?:\/\/[^\/]+).*$/,"$1");
    var text=doc.body.innerHTML.replace(/^\s*var cvMainNav \=\s*/,"").replace(/;[\s\n]*$/,""),parsed,x,i,j;
    //   console.log("text="+text);
    try {
	parsed=JSON.parse(text);
	Gov.get_parsed_civica_urls(base_url,parsed.items);
	console.log("Gov.dept_links="+JSON.stringify(Gov.dept_links));
    }
    catch(error) { console.log("Error parsing civicasoftnav"); }
    Gov.scrape_none(old_doc,base_url,resolve,reject);

};
/* Extract urls from civica return */
Gov.get_parsed_civica_urls=function(base,items,dept) {
    var i,j,contacthref_regex=/contact/i,out_str="",bad_dept_regex=/Events|Minutes|Agenda/;
    Gov.dept_page="";
    for(i=0; i < items.length; i++) {
	if(!/^http/.test(items[i].url)) items[i].url=base+items[i].url;
	if(!dept&&(Gov.contact_regex.test(items[i].text)) && !Gov.bad_contact_regex.test(items[i].text)&&
	   !Gov.bad_link_regex.test(items[i].url) && !Gov.includes_link(Gov.contact_links,{url:items[i].url,name:items[i].text.trim()}) &&
	   !Gov.bad_out_link_regex.test(items[i].url) && !/\/blob/.test(items[i].url) &&
	   !MTP.is_bad_url(items[i].url,[],-1,4)) Gov.contact_links.push({url:items[i].url,name:items[i].text.trim()});
	if(Gov.matches_dept_regex(items[i].text.trim()) && !Gov.bad_out_link_regex.test(items[i].url) &&
	   !Gov.includes_link(Gov.dept_links,{url:items[i].url,name:items[i].text.trim()},true) && !Gov.bad_link_regex.test(items[i].url) &&
	   !bad_dept_regex.test(items[i].text) && !/\/blob/.test(items[i].url)) Gov.dept_links.push({url:items[i].url,name:items[i].text});
	if(items[i].menu!==undefined &&
	   items[i].menu.items!==undefined) Gov.get_parsed_civica_urls(base,items[i].menu.items,/^Departments/i.test(items[i].text));
    }

};

Gov.scrape_municipalcms=function(doc,url,resolve,reject) {
    var new_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1")+"/staff.aspx";
    var promise=MTP.create_promise(new_url,Gov.parse_municipalcms_dir,resolve,reject);
};
Gov.parse_municipalcms_dir=function(doc,url,resolve,reject) {
    var notebox=doc.querySelectorAll(".noteBox"),i,j,curr_contact,curr_dept,header,curr_el,x,term,email;
    var term_map={".staffLineName":"name",".staffLineTitle":"title",".staffLinePhone":"phone"};
    if(notebox.length===0 && Gov.parse_municipalcms_dir_ugly(doc,url,resolve,reject)) return true;
    else if(notebox.length===0 && (Gov.scrape_none(doc,url,resolve,reject)||true)) return true;
    for(i=0;i<notebox.length;i++) {
	if(header=notebox[i].querySelector(".itemHeader")) curr_dept=header.innerText.trim();
	else continue;
	curr_el=notebox[i].nextElementSibling;
	while(curr_el && !/rounded/.test(curr_el.className)) {
	    if(!curr_el.querySelector(".staffLineName")) {  curr_el=curr_el.nextElementSibling; continue; }
	    curr_contact={department:curr_dept};
	    for(x in term_map) { if(term=curr_el.querySelector(x)) curr_contact[term_map[x]]=term.innerText.trim(); }
	    if(email=curr_el.querySelector(".staffLineEmail a")) curr_contact.email=email.href.replace(/^\s*mailto:\s*/,"");
	    Gov.contact_list.push(curr_contact);
	    curr_el=curr_el.nextElementSibling;
	}
    }
    console.log("MOOO");
    resolve("");

};
/* parse the uglier version that list the departments */
Gov.parse_municipalcms_dir_ugly=function(doc,url,resolve,reject) {
    console.log("IN parse_municipalcms_dir_ugly");
    var i,head=doc.querySelector("#depHead"),container,curr_ext,match,new_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1"),name,inner_span;
    var promise_list=[],text;
    if(!head) return false;
    container=head.parentNode;
    for(i=0;i<container.children.length;i++)  {
	if(inner_span=container.children[i].querySelector("span span")) inner_span.parentNode.removeChild(inner_span);
	if((match=container.children[i].outerHTML.match(/staff\.aspx[^\']*/)) && (text=container.children[i].innerText.trim()) &&
	   Gov.matches_dept_regex(text)) {
	    console.log("url="+new_url+"/"+match[0]);
	    promise_list.push(MTP.create_promise(new_url+"/"+match[0], Gov.parse_municipalcms_page,MTP.my_then_func,
						 MTP.my_catch_func,text)); }
    }
    Promise.all(promise_list).then(function(response) {
	console.log("Finished scrape_none promises "+response);
	resolve("MOOOOOOOOOOOO "+response); });
    return true;
}
Gov.parse_municipalcms_page=function(doc,url,resolve,reject,dept) {
    console.log("IN parse_municipalcms_page, url="+url+", dept="+dept);
    var table,i,curr_contact,row,a,email;
    if(!(table=doc.querySelector(".staffListResultsLeft table")) && (resolve("")|true)) return;
    if(table.rows.length>0 && table.rows[0].querySelector(".staffHeader")) table.deleteRow(0);
    for(i=1;i<table.rows.length;i++) {
	row=table.rows[i];
	if(row.cells.length>=1 && (a=row.cells[0].querySelector("a"))) email=a.href.replace(/^\s*mailto:\s*/,"");
	else email="";
	if(row.cells.length>=3) {
	    Gov.contact_list.push({name:row.cells[0].innerText,phone:row.cells[2].innerText,title:row.cells[1].innerText,
				   department:dept,email:email}); }
    }

    resolve(""); }

Gov.scrape_municipalimpact=function(doc,url,resolve,reject) {
    var links=doc.querySelectorAll(".dropdown a"),i,promise_list=[],dept="";
    for(i=0;i<links.length;i++) {
	dept="";
	links[i].href=MTP.fix_remote_url(links[i].href,url);
	//console.log("links[i].innerText="+links[i].innerText);
	if((dept=Gov.matches_dept_regex(links[i].innerText))||Gov.contact_regex.test(links[i].innerText)) {
	    promise_list.push(MTP.create_promise(links[i].href,Gov.parse_municipalimpact,MTP.my_try_func,MTP.my_catch_func,dept)); }
    }
    console.log("promise_list.length="+promise_list.length);
    Promise.all(promise_list).then(function(response) { resolve("Done municipalimpact "+response); });
};
Gov.parse_municipalimpact=function(doc,url,resolve,reject,dept) {
    console.log("Gov.parse_municipalimpact,url="+url);
    var contacts=doc.querySelectorAll("#contact_info .item"),item,i,curr_contact;
    console.log("contacts.length="+contacts.length);
    contacts.forEach(function(item) {
	Gov.fix_emails(item);
	if(curr_contact=Gov.parse_data_func(item.innerText) && curr_contact.name&&curr_contact.title) Gov.contact_list.push(curr_contact);
    })
    resolve("Done url="+url);
};

Gov.scrape_revize=function(doc,url,resolve,reject) {
    var link_list=Gov.get_contact_links(doc,url,resolve,reject),i,promise_list=[];
    for(i=0;i<Gov.contact_links.length;i++) {
	promise_list.push(MTP.create_promise(Gov.contact_links[i].url,Gov.parse_revize_directory,MTP.my_then_func,MTP.my_catch_func)); }


    Promise.all(promise_list).then(function(response) {
	if(Gov.contact_list.length<=1) { console.log("# No contacts found in revize directory");
					 Gov.scrape_none(doc,url,resolve,reject); return; }
	else resolve(""); });

};
/* parse directory for revize sites */
Gov.parse_revize_directory=function(doc,url,resolve,reject) {
    console.log("in Gov.parse_revize_directory at "+url);
    var table=doc.getElementsByTagName("table"),title_map;

    if(table.length>0) {
	title_map=Gov.guess_title_map(table[0].rows[0]);
	console.log("title_map="+JSON.stringify(title_map));
	if(!((title_map.name===undefined&&title_map.first===undefined)
	     ||(title_map.title===undefined))) Gov.parse_table(table[0],title_map,1,table[0].rows.length);
    }
    resolve("");


};
Gov.scrape_egovstrategies=function(doc,url,resolve,reject) {
    var promise,new_url=url.replace(/\/$/,"")+"/egov/apps/staff/directory.egov";

    promise=MTP.create_promise(new_url,Gov.begin_egovstrategies,resolve,reject);
};
/* Begin just scrapes each page of the directory in parallel */
Gov.begin_egovstrategies=function(doc,url,resolve,reject) {
    var paging=doc.querySelector(".eGov_paging td"),num,total_pages,i,promise_list=[],url_ext;
    console.log("In Gov.begin_egovstrategies,url="+url);
    if(!paging && (resolve()||true)) return;
    num=paging.innerText.match(/of ([\d]+)/);
    console.log("num="+JSON.stringify(num));
    total_pages=Math.ceil(parseInt(num[1])/25.);
    for(i=1;i<=total_pages;i++) {
	url_ext="?eGov_searchName=&eGov_searchDepartment=&app=6&sect=public&path=browse&act=&id=&page=6_"+i+"&order=";
	promise_list.push(MTP.create_promise(url+url_ext,Gov.parse_egovstrategies_page,MTP.my_then_func,MTP.my_catch_func,i));
    }
    Promise.all(promise_list).then(function(response) { resolve("Done egovstraties "+response); });
};
Gov.parse_egovstrategies_page=function(doc,url,resolve,reject,page_num) {
    console.log(" Gov.parse_egovstrategies_page="+url);
    var i,curr_contact={},row,table=doc.querySelector(".eGov_listContent"),match;
    if(!table && (resolve("")||true)) return;
    for(i=1;i<table.rows.length;i++) {
	row=table.rows[i];
	if(row&&row.cells.length>4) {
	    curr_contact={name:Gov.parse_name_func(row.cells[0].innerText),title:row.cells[1].innerText,
			  department:row.cells[2].innerText,phone:row.cells[4].innerText};
	    if(match=row.cells[3].innerHTML.match(/EmailDecode\(\'([^\']*)/)) curr_contact.email=Gov.egov_strategies_EmailDecode(match[1]);
	    //console.log("("+page_num+", "+i+"), curr_contact="+JSON.stringify(curr_contact));

	    if(Gov.matches_dept_regex(curr_contact.department)&&Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
	}
    }
    //        console.log("Resolving on page "+page_num);
    resolve("Done with "+url);
};
Gov.egov_strategies_EmailDecode=function(charlist) {
    var thiscode, thischar,CharString = new String(charlist),CharArray = CharString.split('|');
    var L = CharArray.length,AddrDecoded = "";
    for (var x=0; x < L; x++) AddrDecoded += String.fromCharCode(CharArray[x] - L );
    return AddrDecoded;
};
/* Scrape_govoffice websites */
Gov.scrape_govoffice=function(doc,url,resolve,reject) {
    var i,promise_list=[];
    console.log("In Gov.scrape_govoffice");
    Gov.get_contact_links(doc,url,resolve,reject);
    for(i=0;i<Gov.contact_links.length;i++) {
	//console.log("Gov.contact_links["+i+"]="+Gov.contact_links[i].url);
	if(/B_DIR/.test(Gov.contact_links[i].url)||/Directory/.test(Gov.contact_links[i].name)) promise_list.push(MTP.create_promise(Gov.contact_links[i].url,Gov.parse_govoffice_B_DIR,Gov.parse_contact_then));
    }
    for(i=0;i<Gov.dept_links.length;i++) {
	// console.log("Gov.dept_links["+i+"]="+Gov.dept_links[i].url);
	if(/B_DIR/.test(Gov.dept_links[i].url)) promise_list.push(MTP.create_promise(Gov.dept_links[i].url,Gov.parse_govoffice_B_DIR,Gov.parse_contact_then));
    }
    if(promise_list.length>0) {
	Promise.all(promise_list).then(function(response) {
	    console.log("response="+response);
	    if(Gov.contact_list.length>0) resolve("Done with govoffice");
	    else {
		console.log("No contacts found in govoffice"); Gov.scrape_none(doc,url,resolve,reject); } }); }
    else {
	console.log("None");
	Gov.scrape_none(doc,url,resolve,reject); }
};
Gov.parse_govoffice_B_DIR=function(doc,url,resolve,reject) {
    console.log("Gov.parse_govoffice_B_DIR, url="+url);
    var B_DIR=doc.querySelector(".B_DIR"),vcard=doc.querySelectorAll(".vcard"),dept_name;
    var promise_list=[],i,summaryDisplay=doc.querySelectorAll(".summaryDisplay"),department,a;
    if(summaryDisplay.length===0) summaryDisplay=doc.querySelectorAll(".itemSummary");
    if(!B_DIR && summaryDisplay.length===0&& resolve("Failed to find .B_DIR in "+url)) return;
    for(i=0;i<summaryDisplay.length;i++) {
	department=summaryDisplay[i].querySelector(".department");
	a=summaryDisplay[i].querySelector("a");
	a.href=MTP.fix_remote_url(a.href,url);
	dept_name=department?department.innerText.replace(/Department:/,"").trim():"";

	console.log("summaryDisplay["+i+"], department="+(dept_name)+",a="+(a?a.href:""));
	if(a) promise_list.push(MTP.create_promise(a.href,Gov.parse_govoffice_vcard,MTP.my_then_func,MTP.my_catch_func,dept_name));
    }
    Promise.all(promise_list).then(function() { resolve("Done with B_DIR "+url); });
};
Gov.parse_govoffice_vcard=function(doc,url,resolve,reject,dept_name) {
    console.log("Gov.parse_govoffice_vcard,url="+url);
    var vcard=doc.querySelectorAll(".vcard"),item=doc.querySelectorAll(".item");
    vcard.forEach(function(elem) {
	var term_map={".fn":"name",".title":"title",".department":"department"},text="",term,x;
	for(x in term_map) if(term=elem.querySelector(x)) text=text+term.innerText+"\n";
	elem.querySelectorAll(".field .value").forEach(function(val) {
	    var regex=/mayle\(\'([^\']*)\',\s*\'([^\']*)\'\)/,match,scripts=val.getElementsByTagName("script");
	    if(scripts.length>0 && (match=scripts[0].innerHTML.match(regex))) val.innerHTML=match[2]+"@"+match[1].replace(/:/g,".");
	    else if(/tel/.test(val.parentNode.className)) val.innerHTML=val.innerHTML.trim().replace(/(\))([\d]{1})/,"$1 $2")
		.replace(/^([\d]{3})([\d]{3})([\d]{4})/,"$1-$2-$3");
	    text=text+val.parentNode.innerText.replace(/\n/g,"")+"\n";
	});
	console.log("text="+text);

	var curr_contact=Gov.parse_data_func(text);
	if(!curr_contact.department) curr_contact.department=dept_name;
	console.log("curr_contact="+JSON.stringify(curr_contact));
	if(curr_contact&&curr_contact.name&&curr_contact.title&&Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
    });
    item.forEach(function(elem) {
	var curr_contact=Gov.parse_data_func(elem.innerText);
	console.log("curr_contact="+JSON.stringify(curr_contact));

	if(curr_contact&&curr_contact.name&&curr_contact.title&&Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
    });
    resolve("Done vcard at "+url);
};
Gov.scrape_visioninternet=function(doc,url,resolve,reject) { };
Gov.scrape_municodeweb=function(doc,url,resolve,reject) {
    var directory_promise=MTurkScript.prototype.create_promise(url.replace(/\/$/,"")+"/directory",
							       Gov.parse_municodeweb_directory,Gov.parse_municodeweb_directory_then,
							       Gov.parse_municodeweb_no_directory);
};
/* parse directory for municodeweb sites TODO: fix if redirecting */
Gov.parse_municodeweb_directory=function(doc,url,resolve,reject) {
    console.log("in Gov.parse_municodeweb_directory at "+url);
    doc.querySelectorAll(".view-directory-listings .responsive").forEach(Gov.parse_municodeweb_dept);
    doc.querySelectorAll(".view-directory-listings .views-table").forEach(Gov.parse_municodeweb_dept_table);
    if(doc.querySelectorAll(".view-directory-listings .responsive").length===0 &&
       doc.querySelectorAll(".view-directory-listings .views-table").length===0 && doc.title==="404 Not Found")  {
	console.log("doc.head.innerHTML="+doc.head.innerHTML);
	/* <title>404 Not Found</title><meta http-equiv="refresh" content="0;URL=/404-error"> */
    }
    resolve("");
};
/* parse individual department for municodeweb sites */
Gov.parse_municodeweb_dept=function(elem) {
    console.log("In Gov.parse_municodeweb_dept");

    var row=elem.getElementsByClassName("views-row"),dept=elem.getElementsByTagName("h3")[0].innerText.trim(),i,curr_contact={};
    for(i=0;i<row.length; i++) {
	Gov.fix_emails(row[i]);
	curr_contact={name:row[i].querySelector(".views-field-title .field-content").innerText.trim(),
		      title:row[i].querySelector(".views-field-field-position .field-content").innerText.trim(),
		      phone:row[i].querySelector(".views-field-field-phone-number .field-content").innerText.trim(),
		      email:row[i].querySelector(".views-field-field-email .field-content").innerText.trim(),
		      department:dept};
	if(Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
    }
};
Gov.parse_municodeweb_dept_table=function(elem) {
    console.log("In Gov.parse_municodeweb_dept_table");
    var row=elem.rows,dept=elem.getElementsByTagName("caption")[0].innerText.trim(),i,curr_contact={};
    for(i=1;i<row.length; i++) {
	curr_contact={name:row[i].querySelector(".views-field-title").innerText.trim(),
		      title:row[i].querySelector(".views-field-field-position").innerText.trim(),
		      phone:row[i].querySelector(".views-field-field-phone-number").innerText.trim(),
		      email:row[i].querySelector(".views-field-field-email").innerText.trim(),
		      department:dept};
	if(Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
    }
};
Gov.parse_municodeweb_directory_then=function(result) {
    if(Gov.contact_list.length===0) { console.log("# No contacts found in directory");
				      var promise=MTurkScript.prototype.create_promise(Gov.url,Gov.scrape_none,Gov.resolve,Gov.reject); }
    else Gov.resolve("");
};
Gov.parse_municodeweb_no_directory=function(result) { };

/**
 * Gov.id_from_links searches to a level/depth of 1 to find links that identify the Content Management System
 * powering the site to enable how to best do scrapes
 *  */
Gov.identify_site=function(doc,url,resolve,reject) {
    var i,links=doc.links,scripts=doc.scripts;
    var follow_lst=[],promise_lst=[],gov_match,id,footers;
    if(!Gov.query.id_only) console.log("url="+url);
    for(i=0; i < links.length; i++) {
	if((gov_match=links[i].href.match(Gov.id_regex)) && !/action\.asp/.test(links[i].href)
	   && !/\/\?/.test(links[i].href))  return gov_match[0].replace(/\.[^\.]*$/,"").replace(/^(\.|\/)/,"");
	else if(/municodeweb/i.test(links[i].innerText)) return "municodeweb";
    }
    for(i=0;i<scripts.length;i++) {
	if(/^\s*var _paq/.test(scripts[i].innerHTML) &&
	   (gov_match=scripts[i].innerHTML.match(Gov.id_regex))) return gov_match[0].replace(/\.[^\.]*$/,"").replace(/^(\.|\/)/,"");
	if(scripts[i].src && (gov_match=scripts[i].src.match(Gov.id_regex))) return gov_match[0].replace(/\.[^\.]*$/,"").replace(/^(\.|\/)/,"");
    }
    if(doc.querySelector("[title='Log in to Tribune']")) return "sophicity";
    footers=doc.querySelectorAll("#footer,.footer,footer,.footer-copyright,.copyright,#copyright,.sites-adminfooter,[id*='footer'] i");
    //if(footers.length===0) { console.log("#NO FOOTERS"); }
    footers.forEach(function(footers) { var temp_id=""; if(footers&&(temp_id=Gov.search_footers(url,footers))) id=temp_id; });
    if(id&&id!=="none") return id;
    return "none";

};
Gov.search_footers=function(url,footers) {
    var id=null,the_domain=MTP.get_domain_only(url,true);
    // console.log(the_domain+":footers");
    var footer_list=[];
    if(/GovDesigns\.com/i.test(footers.innerText)) return "govdesigns";
    footers.querySelectorAll("a").forEach(function(a) {

	a.href=MTP.fix_remote_url(a.href,url);
	var curr_domain=MTP.get_domain_only(a.href,true);
	if(curr_domain!==the_domain && curr_domain!==MTP.get_domain_only(window.location.href,true) && !footer_list.includes(curr_domain)
	   && !Gov.bad_out_link_regex.test(a.href) && !Gov.bad_link_regex.test(a.href) && !MTP.is_bad_url(a.href.replace(/\/$/,""),[],3)) {
	    // console.log(the_domain+", found "+a.href);
	    footer_list.push(curr_domain);
	    id=curr_domain.replace(/\.*$/,"");
	}

    });
    return null;
};

/* initialize the regex for iding site types */
Gov.init_id_regex=function() {
    var id_regex_str="";
    for(var x in Gov.scrapers) {
	if(x!=="none") {
	    if(id_regex_str.length>0) id_regex_str=id_regex_str+"|";
	    id_regex_str=id_regex_str+"(\/|\\.)"+x+"\\.com"; }
    }
    Gov.id_regex=new RegExp(id_regex_str);
};
/* Refresh the page to a new page if necessary */
Gov.needs_refresh=function(doc,url) {

    var meta=doc.querySelector("[http-equiv='refresh'] i"),url_match,script=doc.head.getElementsByTagName("script"),i,match,content;
    if(!meta) meta=doc.querySelector("META[HTTP-EQUIV]");
    if(meta) {
	//document.body.innerHTML=document.body.innerHTML+"refresh: "+url+"<br>";
	if((content=meta.getAttribute("content"))&&(url_match=content.match(/URL\=([^;]+)/i))) {
	    document.body.innerHTML=document.body.innerHTML+"url_match: "+JSON.stringify(url_match)+"<br>";
	    return !/^http/.test(url_match[1])?(url+"/"+url_match[1]).replace(/\/\/+/,"/") : url_match[1];
	}
    }
    for(i=0;i<1&&i<script.length;i++) {
	if(url_match=script[i].innerHTML.match(/window\.location\.replace\((?:\"|\')([^\"\']+)/) && doc.body.innerHTML.length<100) {
	    document.body.innerHTML=document.body.innerHTML+"refresh: "+url+"<br>";
	    document.body.innerHTML=document.body.innerHTML+"url_match(script): "+JSON.stringify(url_match)+"<br>";
	    if(!/^http/.test(url_match[1])) return (url+"/"+url_match[1]).replace(/\/\/+/,"/");
	    else return url_match[1];
	}
    }
    return null;



};
/* Initialize the nlp compromise thing */
Gov.init_nlp=function() {
    var plugin = {
	words:{
	    'chief':'Honorific',
	    'patrol officer': 'Honorific',
	    'detective': 'Honorific',
	    'capt.':'Honorific',
	    'sgt.':'Honorific'
	}
    };
    nlp.plugin(plugin);
};
/** Gov.init_Gov will initialize government search being given a url (string) and a query (object)
 *
 * query:{dept_regex_lst:array,title_regex_lst:array,id_only:boolean,default_none:boolean} for now querytype should always be search, dept_regex_lst
 * should be a list of regular expressions that correspond to good either department or title
 * id_only says whether we just want to id the page type 
 * default_scrape says whether or not to default to scrape_none (for use outside government)
 */
Gov.init_Gov=function(doc,url,resolve,reject,query)
{
    var refresh=Gov.needs_refresh(doc,url),promise;
    if(refresh && (promise=MTP.create_promise(refresh,Gov.init_Gov,resolve,reject,query)||1)) return;
    var dom=url.replace(/^https?:\/\//,"").replace(/^www\./,"");
    Gov.init_nlp();
    //console.log("doc.head.innerHTML="+doc.head.innerHTML);
    // console.log("doc.body.innerHTML="+doc.body.innerHTML);
    if(!query.id_only) { console.log("url="+url); console.time("Gov"); }
    Gov.url=url;Gov.query=query;Gov.dept_links=[];Gov.resolve=resolve;Gov.reject=reject;Gov.contact_links=[];
    Gov.debug=query.debug||false;
    Gov.init_id_regex();Gov.depts={};
    Gov.promise_list=[];
    //console.log("Gov.id_regex="+Gov.id_regex);
    Gov.id=Gov.identify_site(doc,url,resolve,reject);
    if(Gov.id_map[Gov.id]) Gov.id=Gov.id_map[Gov.id];

    if(!Gov.query.id_only) {
	console.log("Gov.id="+Gov.id);
	if(!Gov.query.default_scrape && Gov["scrape_"+Gov.id]!==undefined) Gov["scrape_"+Gov.id](doc,url,resolve,reject);
	else Gov.scrape_none(doc,url,resolve,reject);
    }
    else resolve({url:url,id:Gov.id,pop:query.pop,city:query.city,old_url:query.url,html_length:doc.body.innerHTML.length});

}

var parse_contacts_then=function(result) {
    console.timeEnd("Gov");
    var i;
    console.log("### parse_contacts_then: "+result);
    for(i=0; i < Gov.contact_list.length; i++) console.log("contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));

};

function get_id_then(result) {
    console.log("|"+result.url+"|"+result.id+"|"+result.city+"|"+Gov.state+"|"+result.pop+"|"+result.old_url+"|"+result.html_length);
}

Gov.do_CO=function(doc,url,resolve,reject,query) {
    var regex_lst=[new RegExp("^\\s*(Park|Rec|Public Works|Community Service|Administration)","i")];

    // var query={"dept_regex_lst":regex_lst,"title_regex_lst":[/.*/i]};//"id_only":true};
    var a=doc.querySelectorAll("table a"),i,query_list=[],promise_list=[];
    var begin=0;
    for(i=begin;i<a.length;i++) {
	query_list.push({url:a[i].href,name:a[i].innerText});
	promise_list.push(MTurkScript.prototype.create_promise(query_list[i-begin].url,
							       Gov.init_Gov,get_id_then,MTurkScript.prototype.my_catch_func,query));
	//break;
    }
    //var num=126;
    //console.log("querying on "+query_list[num].name+", "+query_list[num].url);


};
Gov.do_CT=function(doc,url,resolve,reject,query) {
    var a=doc.querySelectorAll(".results ul a"),i,query_list=[],promise_list=[];
    var begin=0;
    console.log("a.length="+a.length+", url="+url);
    for(i=begin;i<a.length;i++) {
	query_list.push({url:a[i].href,name:a[i].innerText});
	promise_list.push(MTurkScript.prototype.create_promise(query_list[i-begin].url,
							       Gov.init_Gov,(query.id_only?get_id_then:parse_contacts_then),MTurkScript.prototype.my_catch_func,query));
	if(!query.id_only) return;
    }
};
Gov.do_FL=function(doc,url,resolve,reject,query) {
    var regex_lst=[new RegExp("^\\s*(Park|Rec|Public Works|Community Service|Administration)","i")];

    //var query={"dept_regex_lst":regex_lst,"title_regex_lst":[/.*/i],};
    var a=doc.querySelectorAll(".content-sm a"),i,query_list=[],promise_list=[],new_url;
    var begin=0,str="";
    console.log("a.length="+a.length+", url="+url);
    for(i=begin;i<a.length;i++) {
	new_url=a[i].dataset.website;
	if(!new_url||/@/.test(new_url)||new_url.length===0) continue;
	if(new_url.length>0 && !/^http/.test(new_url)) new_url="http://"+new_url;
	console.log(new_url);
	str=str+new_url+"<br>";
	if(new_url.length>0) {
	    //  promise_list.push(MTurkScript.prototype.create_promise(new_url,Gov.init_Gov,(query.id_only?get_id_then:parse_contacts_then),MTurkScript.prototype.my_catch_func,query));
	}
	//  break;
    }
    doc.body.innerHTML=str;
    //console.log("querying on "+query_list[num].name+", "+query_list[num].url);


};
Gov.do_GA=(doc,url,resolve,reject,query)=>{ Gov.do_csv(doc,url,resolve,reject,query); };
Gov.do_IN=function(doc,url,resolve,reject,query) {
    var i,reg=/var _dirdata \= (.*);/,match,parsed,new_url,promise_list=[];
    var begin=0;
    var str="";
    for(i=0;i<doc.scripts.length;i++) {
	if(match=doc.scripts[i].innerHTML.match(reg)) {
	    parsed=JSON.parse(match[1]);
	    break;
	}
    }
    for(i=begin;i<parsed.length;i++) {
	new_url=parsed[i].Website;
	if(!parsed[i].Website||/null/.test(parsed[i].Website)||/@/.test(parsed[i].Website)) continue;
	if(new_url.length>0 && !/^http/.test(new_url)) new_url="http://"+new_url;
	str=str+new_url+"<br>";
	console.log(new_url);
	if(new_url.length>0) {
	    /*promise_list.push(MTurkScript.prototype.create_promise(new_url,
	      Gov.init_Gov,(query.id_only?get_id_then:parse_contacts_then),MTurkScript.prototype.my_catch_func,query));*/
	}

    }
    document.body.innerHTML=str;
};
Gov.do_IA=(doc,url,resolve,reject,query)=>{ Gov.do_csv(doc,url,resolve,reject,query); };
Gov.do_NJ=function(doc,url,resolve,reject,query) {
    var regex_lst=[new RegExp("^\\s*(Park|Rec|Public Works|Community Service|Administration)","i")];
    //var query={"dept_regex_lst":regex_lst,"title_regex_lst":[/.*/i],};
    var a=doc.querySelectorAll("#content a"),i,query_list=[],promise_list=[],new_url;
    var begin=0;
    console.log("a.length="+a.length+", url="+url);
    for(i=begin;i<a.length;i++) {
	new_url=MTP.fix_remote_url(a[i].href,url);
	if(new_url.length>0 && !/^http/.test(new_url)) new_url="http://"+new_url;
	// console.log("new_url="+new_url);
	//console.log("query.id_only="+query.id_only);
	//query_list.push({url:a[i].href,name:a[i].innerText});
	if(new_url.length>0) {
	    promise_list.push(MTurkScript.prototype.create_promise(new_url,
								   Gov.init_Gov,(query.id_only?get_id_then:parse_contacts_then),
								   query.id_only?get_id_then:MTurkScript.prototype.my_catch_func,query));
	}
	// break;
    }
};
Gov.split_csv=function(line) {
    // document.body.innerHTML=document.body.innerHTML+line+"<br>";
    var ret=[],csv_regex=/([^\"]{1}[^,]+)|(\"[^\"]+\")/,match;
    while(line.length>0) {
	match=line.match(csv_regex);
	if(match && (ret.push(match[0].replace(/\"/g,""))||1)) line=line.replace(csv_regex,"").replace(/^,/,"");
	else if(/^,/.test(line)) line=line.replace(/^,/,"");
	else break;
	// document.body.innerHTML=document.body.innerHTML+"("+line+")<br>";
    }
    return ret;
};
Gov.query_obj={};
Gov.do_csv=function(doc,url,resolve,reject,query,begin) {
    var split_text=doc.body.innerHTML.split("\n"),i,new_url,promise_list=[],split_line,ret,x;
    if(begin===undefined) begin=query.id_only ? 0 : 0;
    var query_obj={};
    var increment=50;

    for(i=begin;i<begin+increment&&i<split_text.length;i++) {
	ret=Gov.split_csv(split_text[i]);
	//console.log("ret="+JSON.stringify(ret));
	split_line=ret;
	new_url=split_line[0];
	if(split_line[0]===undefined) {
	    //console.log("got undefined split_line[0] with "+split_text[i]+", i="+i);
	    continue;
	}
	var dom=new_url.replace(/^https?:\/\//,"").replace(/^www\./,"");
	Gov.query_obj[dom]={};
	Gov.query_obj[dom].city=split_line.length>1?split_line[1].replace(/,.*$/,"").replace(/^.*\sof\s/,""):"";
	Gov.query_obj[dom].pop=split_line.length>2?split_line[2]:"";
	query.city=Gov.query_obj[dom].city;
	query.pop=Gov.query_obj[dom].pop;
	query.url=new_url;

	//    for(x in query) { Gov.query_obj[new_url][x]=query[x]; }

	// console.log("query="+JSON.stringify(query));
	if(new_url.length>0 && !/^http/.test(new_url)) new_url="http://"+new_url;
	if(!query.id_only) console.log("new_Url="+new_url);
	//console.log("query.id_only="+query.id_only);
	//query_list.push({url:a[i].href,name:a[i].innerText});
	//doc.body.innerHTML=doc.body.innerHTML+"<div style='margin:5px'>MOO "+i+"</div>";

	if(new_url.length>0) {
	    promise_list.push(MTurkScript.prototype.create_promise(new_url,
								   Gov.init_Gov,(query.id_only?get_id_then:parse_contacts_then),Gov.catch_func,Object.assign({},query)));
	}
	if(!query.id_only) return;
    }
    //  doc.body.innerHTML=doc.body.innerHTML+"<div style='margin:5px'>MOO</div>";
    if(query.id_only && begin+increment<split_text.length) {
	setTimeout(function() { Gov.do_csv(doc,url,resolve,reject,query,begin+increment); }, 5000); }
    else { /*console.log("done queries");*/ }
};
Gov.catch_func=function(response,url) {
    console.log("Failed url="+url); };

//function init_Query() {
//   my_query={};
 //   var i;
//    console.log("init_query");
 //   //console.log("is_bad_url for "+window.location.href+" = "+MTurkScript.prototype.is_bad_url(window.location.href,[],3));
 //   if(/facebook\.com/.test(window.location.href) || MTurkScript.prototype.is_bad_url(window.location.href,[],3)) return;
 //   var regex_lst=[new RegExp("^\\s*(Parks? |Rec(r| )|Public Works|Community Service|Leisure|Administration|Administrator|City (Administrator|Manager))","i")];
  //  var state_query_map={CO:"https://www.cml.org/cml-member-directory/",CT:"https://portal.ct.gov/Government/Cities-and-Towns",

//			 "GA":"https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/GAcities.csv",
//			 "IN":"https://aimindiana.org/directory/all/",
//			 "IA":"https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/IAcities.csv"};
 //   var query={"dept_regex_lst":regex_lst,"title_regex_lst":[/.*/i],"id_only":true};
  //  if(window.location.href.indexOf("trystuff.com")!==-1) {
/*	var state="IL";
	Gov.state=state;
	var state_url=state_query_map[state];
	if(!state_url) {
	    state_url="https://raw.githubusercontent.com/jacobmas/MTurkScripts/ebd295e5ef44e17694f0cc6a95281c62f0955f55/Govt/CSV/"+state+"cities.csv";
	    console.log("state_url="+state_url);
	    Gov["do_"+state]=Gov.do_csv; }
	var promise=MTurkScript.prototype.create_promise(state_url,Gov["do_"+state],MTurkScript.prototype.my_then_func,MTurkScript.prototype.my_catch_func,query);
	var url="https://bakersfieldcity.us/";
	//    var promise=new MTurkScript.prototype.create_promise(url,Gov.init_Gov,parse_contacts_then,MTurkScript.prototype.my_catch_func,query);
    }


}*/

