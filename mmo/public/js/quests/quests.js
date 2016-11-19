var quests = [
     new Quest(
          "Tale of the Shirtless Man",
          6,
          [],
          [
               new KillEntityObjective(Entity.SKELETON, 5),
               new KillEntityObjective(Entity.BAT, 5),
               new TalkToNPCObjective("Shirtless Steve")
          ],
          1000,
          100
     ),
     new Quest(
          "Cocky Coders",
          2,
          [],
          [
               new TalkInChatObjective("Question: what is a variable?", "named location in storage"),
          ],
          100,
          25
     )
];

function getQuestID(title){
	for(var i = 0; i < quests.length; i++){
          if(quests[i].getTitle() == title){
               return i;
          }
     }
	return undefined;
}

function getQuestNPC(id){
	for(var i = 0; i < npcs.length; i++){
		var npc = npcs[i];
		if(npc.getQuestID() == id){
			return npc;
		}
	}
	return undefined;
};
