import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Match } from "./match";
import { MatchBeatmap } from "./matchBeatmap";
import { TournamentTeam } from "./tournamentTeam";

@Entity()
export class MatchSet extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    matchID!: number;

    @ManyToOne(() => Match, match => match.sets)
    match!: Match;

    @Column()
    winnerID?: number;

    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.setsWon)
    winner?: TournamentTeam;

    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.set)
    beatmaps?: MatchBeatmap[];

    @Column({ default: 0 })
    teamAScore!: number;
    
    @Column({ default: 0 })
    teamBScore!: number;

    // TODO: FINISH THIS
}