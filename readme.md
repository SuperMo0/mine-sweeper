# Minesweeper Game

Minesweeper game built to practice the MVC pattern.

This game was so much fun to implement. I believe this game is one of the best ways to actually learn how to write clean code.

I realized that I can also make my data models observable and then my view will subscribe to any model changes, which helped me understand React more.

I kept it simple this time, I didn't implement observable pattern I just let the controller handle everything:

1. View delegates the user action to the controller
2. Controller tells the model classes to update
3. Model classes update and return what got updated to the controller
4. Controller tells the view to update what needs to be updated

Without this pattern things can get messy really quickly.
