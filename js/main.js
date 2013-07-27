var socket = io.connect('http://209.129.244.25');
var currentSearch;
$('.search').on('click', function() {
	$('.output ul li').remove();
	$('.word-list option').remove();
	var words = $('.query').val().split(' ');
	for (var i = 0; i < words.length; i++) {
		words[i] = $.trim(words[i]).toUpperCase();
	};
	currSearch = words;
	socket.emit('queryWord', words);
});
$('.add-list').on('click', function() {
	var data = {
		WORD: $('.word-list').val(),
		PRON: $('.pron-list').val().toUpperCase()
	}
	socket.emit('addWord', data);
});
socket.on('refresh', function() {
	$('.output ul li').remove();
	$('.word-list option').remove();
	socket.emit('queryWord', currSearch);
})
socket.on('getPron', function(data, word) {

	var content = ""
	for (var i = 0; i < word.length; i++) {
		content += "<option class='user-option' value='" + word[i] + "'>" + word[i] + "</option>";
	};

	$(".word-list").append(content);

	var message = "<div class='list'>";
	for (var i = 0; i < data.length; i++) {
		message += "<li>"
		message += "<span class='word'>" + data[i].WORD + "</span>";
		message += " = "
		message += "<span class='pron' contenteditable='true' val='" + data[i]._id + "'>" + data[i].PRON + "</span>";
		message += "<img class='delete' val='" + data[i]._id + "'src='delete.svg' style='padding-left: 5px; width: 20px'>";
		message += "</li>"
	};
	message += "</div>";
	$('.output ul').append(message);
});

$(".list").livequery(function() {
	$(".pron").blur(function() {
		var edit = $(this).text().toUpperCase();
		var id = $(this).attr('val');
		console.log(id);
		socket.emit('updateWord', id, edit);
	});
	$(".delete").on('click', function() {
		var id = $(this).attr('val');
		$(this).parents('li').remove();
		socket.emit('deleteWord', id);
	});
});