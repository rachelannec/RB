*This is a submission for the [Alibaba Cloud](https://int.alibabacloud.com/m/1000402443/) Challenge: [Build a Web Game](https://dev.to/challenges/alibaba).**

## What WE Built
<!-- Share a brief overview of your robot-themed game project. -->
RoboRebellion is a top-down action shooter where players control one of three specialized combat robots. Fight through endless waves of enemy robots in an arena-style battlefield, collecting powerups and maximizing your score.<br>
**FOR MORE INFORMATION ABOUT OUR GAME, SEE [README.md](https://github.com/rachelannec/RR-R/blob/main/README.md)**

## Demo
<!-- Share a link to your game and include some screenshots here. -->

![Robo Rebellion Start Screen](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a7yur6fvapk0cumy055v.png)



### PLAY IT HERE: [https://robot-rr.vercel.app/](https://robot-rr.vercel.app/) 
### GITHUB REPO HERE: [https://github.com/rachelannec/RR-R](https://github.com/rachelannec/RR-R)

#### 1. Gameplay

##### 1.1 Core Loop

1.  Select robot class
2.  Battle waves of enemies
3.  Collect powerups
4.  Survive as long as possible
5.  Game over when health reaches zero
6.  Compete for high scores

##### 1.2 Player Controls

-   **Movement**: WASD or Arrow Keys
-   **Aim**: Mouse pointer
-   **Shoot**: Left mouse button
-   **Dash**: Spacebar (3-second cooldown)
-   **Pause**: ESC key

##### 1.3 Player Characters

Robot Type | Color | Speed | Health | Fire Rate | Damage | Special Traits
| -- | -- | -- | -- | -- | -- | -- | 
Assault | Green | 220 | 100 | Fast | Medium | Balanced, versatile
Tank | Yellow | 160 | 150 | Slow | High | Durable, powerful shots
Stealth | Blue | 250 | 75 | Very Fast | Low | Agile, rapid fire

##### 1.4 Enemies

| Enemy Type | Appearance | Behavior | Health | Damage | Points |
| -- | -- | -- | -- | -- | -- |
Chaser | Triangle | Pursues player directly | Low | Medium | 100
Shooter | Diamond | Maintains distance, fires at player | Medium | Low | 150
Tank | Hexagon | Slow movement, fires in multiple directions | High | High | 250

##### 1.5 Powerups
| Powerup | Effect | Duration |
|--|--|--
| Health Pack (Green) | Restores 30 heath | Permanent
| Rapid Fire (Yellow) | 50% faster firing rate | 10 seconds
| Damage Boost (Red) | 50% increased damage | 10 seconds

#### 2. Progression

##### 2.1 Wave System

-   Game starts at Wave 1
-   Each wave increases enemy count and health
-   Enemy type distribution changes as waves progress:
    -   Early waves: Mostly chasers
    -   Mid waves: Mix of chasers and shooters
    -   Later waves: All types with more tanks

##### 2.2 Difficulty Scaling

-   Enemy health increases each wave
-   Enemy damage increases slightly
-   More enemies spawn per wave
-   Enemy type mix becomes more challenging



## Alibaba Cloud Services Implementation
<!-- Provide a detailed breakdown of each Alibaba Cloud service you utilized, why you chose it, how you integrated it into your game, and your experience working with it. Be specific about the benefits and any challenges you encountered with each service.-->
### Overview of Alibaba Cloud Services in Your Game

Our Robo Rebellion game uses **Alibaba Cloud Object Storage Service (OSS)** as the backend storage solution. Here's a comprehensive guide to how it's implemented. <br>

1. **OSS Integration Architecture** <br>
`Game Client (Browser) ↔ Node.js Server ↔ Alibaba Cloud OSS`
- **Client-side**: Makes API calls to your server
- **Server-side**: Authenticates and interacts with OSS
- **OSS**: Stores and retrieves game data

2. **Key Components**

**Server-Side Integration (server.js)** <br>

```javascript
// OSS Client configuration
function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
    endpoint: process.env.OSS_ENDPOINT,
    secure: true
  });
}
```
**Data Storage Structure**
Your implementation uses three main storage areas:

- leaderboard.json - Global leaderboard data
- scores/ - Individual score files

3. **OSS Operations Used** <br>

| Operation | Purpose             | Example |
| ----------- | --------------------- | --------- |
| **put**   | Store data           | `client.put('scores/123456.json', Buffer.from(JSON.stringify(data)))` |
| **get**   | Retrieve data        | `client.get('leaderboard.json')` |
| **list**  | List files           | `client.list({ prefix: 'scores/', 'max-keys': 100 })` |
| **head**  | Check if file exists | `client.head('leaderboard.json')` |

5. **Key Features**<br>
**Leaderboard System**
```js
// Update leaderboard with the new score
try {
  // Get existing leaderboard
  const result = await client.get('leaderboard.json');
  const leaderboard = JSON.parse(result.content.toString());
  
  // Add new score
  leaderboard.push(scoreData);
  
  // Sort by score (highest first)
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Keep top 100 scores
  const topScores = leaderboard.slice(0, 100);
  
  // Save back to OSS
  await client.put('leaderboard.json', Buffer.from(JSON.stringify(topScores)));
}
```
**Individual Score Records**
- Each score is saved as an individual JSON file
- Filename pattern: scores/{timestamp}_{robotType}_{score}.json
- Includes metadata like player name, robot type, and timestamp

### Our Experience Working With Alibaba Cloud
**Just similar on what we have written in our another submission.** *Lemme just copy & paste it* <br>
**Story time.** <br>Since we cannot avail the free trial we really went out buying for the stuff 😆. <br>
About setting the OSS up, at first I really got no idea on where to start after availing it, like ***"what do you mean buckets?" and "where do I actually find and get this access keys?" 😭*** <br>
Luckily, there are some tutorials on Youtube and there's also AI, that really helped us to set up the backend of our game (let me also say that this is my first time tapping into backend stuff, so it really crack my head) <br>
So, yeah! Even though we don't really know what we are doing on the first line, as long as we keep going, we'll get there. (⚠ LOCAL JOKE AHEAD) <br><br>
Like, **STEP BY STEP PALA S'YA, SASAKSES RIN PALA! in integrating the Alibaba Cloud Services 😆😅**


 
## Game Development Highlights
<!-- Briefly share any particularly interesting aspects of your development process or features you're proud of. -->

![IG Story Screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zvgro9wr58pp5une6r4l.png)



The aspect of our developement process that we proud of is that we did not give up, as you can see here on the picture, it is coded in Svelte but if you look in our github repository, it's in Javascript. And that was because we pivot. 😆<br>
*We did not give up, but we pivot.*


<!-- Team Submissions: Please pick one member to publish the submission and credit teammates by listing their DEV usernames directly in the body of the post. -->

## Meet the TEAM
**Inso, Eliazar N.**  ***[@deadbush225](https://dev.to/deadbush225)*** <br>
**Rodriguez, Jan Earl F.**  ***[@rawrearl](https://dev.to/rawrearl)*** <br>
**Cilon, Rachel Anne**  ***[@rachelannec](https://dev.to/rachelannec)*** 




<!-- ⚠️ By submitting this entry, you agree to receive communications from Alibaba Cloud regarding products, services, events, and special offers. You can unsubscribe at any time. Your information will be handled in accordance with Alibaba Cloud's Privacy Policy. -->

<!-- Don't forget to add a cover image (if you want). -->

<!-- Thanks for participating! -->
