import { BaseEntity, Column, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Phase } from "../phase";
import { Team } from "../team";
import { Mappool } from "./mappool";
import { Bracket } from "./bracket";
import { TournamentTeam } from "./tournamentTeam";
import { Group } from "./group";
import { Qualifier } from "./qualifier";

@Entity()
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @Column(() => Phase)
    registration!: Phase;

    @Column()
    size!: number;

    @Column({ default: true })
    doubleElim!: boolean;
    
    @OneToMany(() => Bracket, bracket => bracket.tournament)
    brackets!: Bracket[];

    @OneToMany(() => Group, group => group.tournament)
    groups!: Group[];

    @OneToMany(() => Qualifier, qualifier => qualifier.tournament)
    qualifiers!: Qualifier[];

    @OneToMany(() => Mappool, mappool => mappool.tournament)
    mappools!: Mappool[];

    @ManyToMany(() => Team, team => team.tournaments)
    teams!: Team[];

    @OneToMany(() => Team, team => team.tournaments)
    tournamentTeams!: TournamentTeam[];
}